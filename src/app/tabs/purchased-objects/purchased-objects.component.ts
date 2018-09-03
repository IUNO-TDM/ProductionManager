import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { ObjectService } from '../../services/object.service';
import { TdmObject } from '../../models/object';
import { MatDialogRef, MatDialog } from '@angular/material';
import { PrintDialogComponent } from '../../print-dialog/print-dialog.component';
import { Filter } from '../../models/filter';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-purchased-objects',
    templateUrl: './purchased-objects.component.html',
    styleUrls: ['./purchased-objects.component.css']
})
export class PurchasedObjectsComponent implements OnInit {
    objects: TdmObject[] = [];
    downloadStates = {};
    materials = [];
    //    selectedObject: any = null;
    selectedObjectId: string = null;
    loading = true;
    orders = [];
    printDialogRef: MatDialogRef<PrintDialogComponent> | null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private titleService: TitleService,
        private objectService: ObjectService,
        private dialog: MatDialog,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        route.params.subscribe(params => {
            this.selectedObjectId = params['id']
        })
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
                        this.changeDetectorRef.detectChanges()
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
        this.router.navigateByUrl('purchased-objects/' + object.id);
        // this.selectedObject = object;
    }

    onDownloadClicked() {
        this.objectService.startDownloadingBinary(this.selectedObjectId).subscribe();
    }

    onPrintClicked() {
        const selectedObject = this.objects.find(object => object.id === this.selectedObjectId)
        if (selectedObject) {
            this.printDialogRef = this.dialog.open(PrintDialogComponent, { data: { tdmObject: selectedObject } });
            this.printDialogRef.afterClosed().subscribe((result: string) => {
                this.printDialogRef = null;
            });
        }
    }

    deselectObject() {
        this.router.navigateByUrl('purchased-objects/');
    }

    isDownloadRequired(objectId) {
        return this.downloadStates[objectId] && this.downloadStates[objectId].isDownloadRequiredState();
    }

    isPrintable(objectId) {
        return this.downloadStates[objectId] && this.downloadStates[objectId].isReadyState();
    }
}
