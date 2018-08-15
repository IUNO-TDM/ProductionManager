import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {LocalObject} from '../../../models/localObject';
import {MaterialService} from '../../../services/material.service';
import {MachineService} from '../../../services/machine.service';
import {MaterialDefinition} from '../../../models/materialDefinition';
import {MachineType} from '../../../models/machineType';
import {MatDialog, MatDialogRef} from '@angular/material';
import {PublishDialogComponent} from '../../../publish-dialog/publish-dialog.component';
import {PrintDialogComponent} from '../../../print-dialog/print-dialog.component';
import {ConfirmationDialogComponent} from '../../../confirmation-dialog/confirmation-dialog.component';
import {LocalObjectService} from '../../../services/local-object.service';

@Component({
    selector: 'app-local-object-details',
    templateUrl: './local-object-details.component.html',
    styleUrls: ['./local-object-details.component.css']
})
export class LocalObjectDetailsComponent implements OnInit {
    @Input() object: LocalObject;
    @Output() deleted = new EventEmitter();

    materialDefinitions = new Array<MaterialDefinition>();
    machineTypes = new Array<MachineType>();

    publishDialogRef: MatDialogRef<PublishDialogComponent> | null;
    printDialogRef: MatDialogRef<PrintDialogComponent> | null;
    confirmationDialogRef: MatDialogRef<ConfirmationDialogComponent>;

    constructor(private materialService: MaterialService, private machineService: MachineService, private dialog: MatDialog,
                private localObjectService: LocalObjectService) {
    }

    ngOnInit() {
        this.materialService.getAllMaterials().subscribe((materialDefinitions) => {
            this.materialDefinitions = materialDefinitions;
        });

        this.machineService.getMachineTypes().subscribe((machineTypes) => {
            this.machineTypes = machineTypes;
        });
    }


    materialNameForGuid(guid: string) {
        if (!guid) {
            return 'no material';
        }
        for (const material of this.materialDefinitions) {
            if (material.id === guid) {
                return material.name;
            }
        }
        return guid;
    }

    machineNameForId(guid: string) {
        if (!guid) {
            return 'no machine';
        }
        for (const machineType of this.machineTypes) {
            if (machineType.id === guid) {
                return machineType.name;
            }
        }
        return guid;
    }

    publishObject() {
        this.publishDialogRef = this.dialog.open(PublishDialogComponent, {data: this.object});
        this.publishDialogRef.afterClosed().subscribe((result: string) => {
            this.publishDialogRef = null;
        });

    }

    printObject() {
        this.printDialogRef = this.dialog.open(PrintDialogComponent, {data: {localObject: this.object}});
        this.printDialogRef.afterClosed().subscribe((result: string) => {
            this.printDialogRef = null;
        });

    }

    deleteObject() {
        this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {
            // height: '400px',
            // width: '600px',
        });
        this.confirmationDialogRef.componentInstance.title = 'Lokales 3D-Objekt löschen?';
        this.confirmationDialogRef.componentInstance.message =
            'Möchten sie das 3D-Objekt mit dem Namen \"'
            + this.object.name + '\" wirklich löschen?';
        this.confirmationDialogRef.componentInstance.leftButtonText = 'abbrechen';
        this.confirmationDialogRef.componentInstance.rightButtonText = 'löschen';

        this.confirmationDialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.localObjectService.deleteObject(this.object.id).subscribe(() => {
                    this.deleted.emit();
                }, (err) => {
                    console.log('Problem on deleting local object', err);
                });
            }
            this.confirmationDialogRef = null;
        });
    }

}
