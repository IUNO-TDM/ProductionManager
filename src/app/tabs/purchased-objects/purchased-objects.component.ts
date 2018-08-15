import { Component, OnInit } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { ObjectService } from '../../services/object.service';
import { TdmObject } from '../../models/object';
import { MatDialogRef, MatDialog } from '@angular/material';
import { PrintDialogComponent } from '../../print-dialog/print-dialog.component';

@Component({
  selector: 'app-purchased-objects',
  templateUrl: './purchased-objects.component.html',
  styleUrls: ['./purchased-objects.component.css']
})
export class PurchasedObjectsComponent implements OnInit {
  objects: TdmObject[] = []
  downloadStates = {}
  materials = []
  machineTypes = []
  selectedObject: any = null
  loading = true
  orders = []
  printDialogRef: MatDialogRef<PrintDialogComponent> | null;

  constructor(
    private titleService: TitleService,
    private objectService: ObjectService,
    private dialog: MatDialog
  ) {
  }

  ngOnInit() {
    this.objectService.getObjects(this.machineTypes, this.materials, true).subscribe(objects => {
      this.objects = objects
      this.objects.forEach(object => {
        this.objectService.getDownloadState(object.id).subscribe(downloadState => {
          this.downloadStates[object.id] = downloadState
        })
      })
      this.loading = false
    })
  }

  ngOnDestroy() {
  }

  ngAfterViewInit() {
    this.titleService.setTitle('Gekaufte Objekte');
  }

  onObjectSelected(object) {
    this.selectedObject = object;
  }

  onDownloadClicked() {
    this.objectService.startDownloadingBinary(this.selectedObject.id).subscribe()
  }

  onPrintClicked() {

    this.printDialogRef = this.dialog.open(PrintDialogComponent, { data: { tdmObject: this.selectedObject } });
    this.printDialogRef.afterClosed().subscribe((result: string) => {
      this.printDialogRef = null;
    });

  }

  deselectObject() {
    this.selectedObject = null;
  }

  isDownloadRequired(objectId) {
    let downloadRequired = this.downloadStates[objectId] && this.downloadStates[objectId].isDownloadRequiredState()
    return downloadRequired
  }

  isPrintable(objectId) {
    let printable = this.downloadStates[objectId] && this.downloadStates[objectId].isReadyState()
    return printable
  }
}
