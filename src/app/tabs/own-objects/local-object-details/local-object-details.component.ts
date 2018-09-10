import {Component, OnInit, Input, Output, EventEmitter, NgZone} from '@angular/core';
import {LocalObject} from '../../../models/localObject';
import {MaterialService} from '../../../services/material.service';
import {MachineService} from '../../../services/machine.service';
import {MatDialog, MatDialogRef} from '@angular/material';
import {PublishDialogComponent} from '../../../publish-dialog/publish-dialog.component';
import {PrintDialogComponent} from '../../../print-dialog/print-dialog.component';
import {ConfirmationDialogComponent} from '../../../confirmation-dialog/confirmation-dialog.component';
import {LocalObjectService, PublishState, UploadState} from '../../../services/local-object.service';
import {Observable, forkJoin} from 'rxjs'
import {flatMap} from 'rxjs/operators'

@Component({
    selector: 'app-local-object-details',
    templateUrl: './local-object-details.component.html',
    styleUrls: ['./local-object-details.component.css']
})
export class LocalObjectDetailsComponent implements OnInit {
    @Input() objectId: string;
    @Output() deleted = new EventEmitter();
    @Output() changed = new EventEmitter();
    object: LocalObject = null
    loading = true

    PublishStateEnum = PublishState;

    uploadState: UploadState;
    publishState: PublishState;
    progress = 0;

    materialDefinitions = [];
    machineTypes = [];

    publishDialogRef: MatDialogRef<PublishDialogComponent> | null;
    printDialogRef: MatDialogRef<PrintDialogComponent> | null;
    confirmationDialogRef: MatDialogRef<ConfirmationDialogComponent>;

    editing = '';

    editedName: string;
    editedDescription: string;

    constructor(
        private zone: NgZone,
        private materialService: MaterialService, private machineService: MachineService, private dialog: MatDialog,
        private localObjectService: LocalObjectService) {
    }

    ngOnInit() {
        forkJoin(
            this.localObjectService.getObject(this.objectId),
            this.materialService.getAllMaterials(false),
            this.machineService.getMachineTypes(),
        ).subscribe(data => {
            this.object = data[0]
            this.materialDefinitions = data[1]
            this.machineTypes = data[2]
            this.editedName = this.object.name;
            this.editedDescription = this.object.description;
            this.loading = false
        })
        
        this.localObjectService.getUploadState(this.objectId).subscribe(uploadState => {
            // this.uploadState = uploadState;
            this.zone.run(() => {
                if (uploadState) {
                    // console.log(uploadState);
                    this.uploadState = uploadState;
                    if (uploadState.bytesTotal > 0) {
                        this.progress = 100 * +uploadState.bytesUploaded / +uploadState.bytesTotal;
                    } else {
                        this.progress = 1;
                    }
                }
            });
        });
        this.localObjectService.getPublishState(this.objectId).subscribe(publishState => {
            this.zone.run(() => {
                this.publishState = publishState;
                this.localObjectService.getObject(this.objectId).subscribe(object => {
                    this.object = object
                })
            });
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
        this.publishDialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                this.uploadState = new UploadState(null);
                this.localObjectService.publishObject(this.object.id, result).subscribe();
                this.changed.emit();
            }
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
        this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {});
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

    updateTitle() {
        this.localObjectService.updateObject(this.object.id, this.editedName, null).subscribe((data) => {
            this.object = data;
            this.changed.emit();
        });
        this.editing = '';
    }

    startUpdateTitle() {
        this.editing = 'title';
        this.editedName = this.object.name;
    }

    updateDescription() {
        this.localObjectService.updateObject(this.object.id, null, this.editedDescription).subscribe((data) => {
            this.object = data;
            this.changed.emit();
        });
        this.editing = '';
    }

    startUpdateDescription() {
        this.editing = 'description';
        this.editedDescription = this.object.description;
    }

    retryPublish() {
        this.localObjectService.retryPublish(this.object.id).subscribe();
    }

    resetPublish() {
        this.localObjectService.resetPublish(this.object.id).subscribe();
    }
}
