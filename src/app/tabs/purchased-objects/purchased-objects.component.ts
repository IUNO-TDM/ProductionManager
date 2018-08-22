import {Component, OnInit} from '@angular/core';
import {TitleService} from '../../services/title.service';
import {ObjectService} from '../../services/object.service';
import {TdmObject} from '../../models/object';
import {MatDialogRef, MatDialog} from '@angular/material';
import {PrintDialogComponent} from '../../print-dialog/print-dialog.component';
import {Filter} from '../../models/filter';

@Component({
    selector: 'app-purchased-objects',
    templateUrl: './purchased-objects.component.html',
    styleUrls: ['./purchased-objects.component.css']
})
export class PurchasedObjectsComponent implements OnInit {
    objects: TdmObject[] = [];
    downloadStates = {};
    materials = [];
    selectedObject: any = null;
    loading = true;
    orders = [];
    printDialogRef: MatDialogRef<PrintDialogComponent> | null;

    constructor(
        private titleService: TitleService,
        private objectService: ObjectService,
        private dialog: MatDialog
    ) {
    }

    ngOnInit() {
        const filter = new Filter();
        filter.lang = 'de';
        filter.purchased = true;
        filter.materials = [];
        filter.machines = [];
        this.objectService.createFilter(filter).subscribe((filterId) => {
            this.objectService.getObjects(filterId).subscribe(objects => {
                this.objects = objects;
                this.objects.forEach(object => {
                    this.objectService.getDownloadState(object.id).subscribe(downloadState => {
                        this.downloadStates[object.id] = downloadState;
                    });
                });
                this.loading = false;
            });
        });

    }

    ngAfterViewInit() {
        this.titleService.setTitle('Gekaufte Objekte');
    }

    onObjectSelected(object) {
        this.selectedObject = object;
    }

    onDownloadClicked() {
        this.objectService.startDownloadingBinary(this.selectedObject.id).subscribe();
    }

    onPrintClicked() {

        this.printDialogRef = this.dialog.open(PrintDialogComponent, {data: {tdmObject: this.selectedObject}});
        this.printDialogRef.afterClosed().subscribe((result: string) => {
            this.printDialogRef = null;
        });
    }

    deselectObject() {
        this.selectedObject = null;
    }

    isDownloadRequired(objectId) {
        return this.downloadStates[objectId] && this.downloadStates[objectId].isDownloadRequiredState();
    }

    isPrintable(objectId) {
        return this.downloadStates[objectId] && this.downloadStates[objectId].isReadyState();
    }
}
