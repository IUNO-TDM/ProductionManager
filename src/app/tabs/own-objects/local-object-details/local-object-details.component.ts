import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {LocalObject} from '../../../models/localObject';
import {MaterialService} from '../../../services/material.service';
import {MachineService} from '../../../services/machine.service';
import {MaterialDefinition} from '../../../models/materialDefinition';
import {MachineType} from '../../../models/machineType';
import {MatDialog, MatDialogRef} from '@angular/material';
import {PublishDialogComponent} from '../../../publish-dialog/publish-dialog.component';

@Component({
    selector: 'app-local-object-details',
    templateUrl: './local-object-details.component.html',
    styleUrls: ['./local-object-details.component.css']
})
export class LocalObjectDetailsComponent implements OnInit {
    @Input() object: LocalObject;

    materialDefinitions = new Array<MaterialDefinition>();
    machineTypes = new Array<MachineType>();

    publishDialogRef: MatDialogRef<PublishDialogComponent> | null;
    // publishDialogConfig = {
    //     disableClose: false,
    //     panelClass: 'custom-overlay-pane-class',
    //     hasBackdrop: true,
    //     backdropClass: '',
    //     width: '',
    //     height: '',
    //     position: {
    //         top: '',
    //         bottom: '',
    //         left: '',
    //         right: ''
    //     },
    //     data: {}
    // };

    constructor(private materialService: MaterialService, private machineService: MachineService, private dialog: MatDialog) {
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
        // this.publishDialogConfig.data = this.object;
        this.publishDialogRef = this.dialog.open(PublishDialogComponent, {data: this.object});
        this.publishDialogRef.afterClosed().subscribe((result: string) => {
            this.publishDialogRef = null;
        });

    }

}
