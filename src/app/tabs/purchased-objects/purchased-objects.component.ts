import { Component, OnInit } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { ObjectService } from '../../services/object.service';
import { TdmObject } from '../../models/object';

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

  constructor(
    private titleService: TitleService,
    private objectService: ObjectService,
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
    this.titleService.setTitle("Gekaufte Objekte")
  }

  onObjectSelected(object) {
    this.selectedObject = object
  }

  onDownloadClicked() {
    this.objectService.startDownloadingBinary(this.selectedObject.id).subscribe()
  }

  deselectObject() {
    this.selectedObject = null;
  }

  isDownloadRequired(objectId) {
    let downloadRequired = this.downloadStates[objectId] && this.downloadStates[objectId].isDownloadRequiredState()
    return downloadRequired
  }
}
