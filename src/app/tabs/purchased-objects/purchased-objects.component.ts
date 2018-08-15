import { Component, OnInit } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { ObjectService } from '../../services/object.service';
import { MachineService } from '../../services/machine.service';
import { OrderService } from '../../services/order.service';
import { TdmObject } from '../../models/object';
import { Router } from '@angular/router';
import { DownloadSocketService } from '../../services/download-socket.service'

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
    private router: Router,
    private titleService: TitleService,
    private objectService: ObjectService,
    private orderService: OrderService,
    private machineService: MachineService,
  ) {

    // this.orderService.getCompletedOrders().subscribe(orders => {
    //   this.orders = orders
    //   var objectIds = this.getObjectIds()
    //   var observables = []

    //   // Get object information from objectService for all purchased objects.
    //   // We put this requests into an array of observables to forkJoin them and
    //   // continue after the information for all objects are loaded.
    //   Object.keys(objectIds).forEach(id => {
    //     observables.push(objectService.getObject(id))
    //   })
    //   forkJoin(observables).subscribe(results => {
    //     this.objects = results
    //     this.loading = false
    //   })
    // })
  }

  // /**
  //  * Returns a dictionary containing object-ids and accumulated amounts of all completed orders.
  //  * @returns a dictionary containing object-ids and accumulated amounts of all completed orders.
  //  */
  // getObjectIds() {
  //   var ids = {}
  //   this.orders.forEach(order => {
  //     order.items.forEach(item => {
  //       var amount = item.amount
  //       if (ids[item.dataId]) {
  //         amount += ids[item.dataId]
  //       }
  //       ids[item.dataId] = amount
  //     })
  //   })
  //   return ids
  // }

  ngOnInit() {
    this.objectService.getObjects(this.machineTypes, this.materials, true).subscribe(objects => {
      this.objects = objects
      this.objects.forEach(object => {
        this.objectService.getDownloadState(object.id).subscribe(downloadState => {
          this.downloadStates[object.id] = downloadState
          // console.log(downloadState)
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
    // this.router.navigateByUrl('purchased-objects/' + object.id)
    this.selectedObject = object
  }

  onDownloadClicked() {
    // this.objectService.downloadBinary(this.selectedObject, 
    //FIXME: Implement this!

    // console.log(this.downloadSocketService)
    // this.downloadSocketService.joinRoom(this.selectedObject.id)
    this.objectService.startDownloadingBinary(this.selectedObject.id).subscribe()
    console.log("Download!" + this.selectedObject.id)
  }

  deselectObject() {
    this.selectedObject = null;
  }

  isDownloaded(tdmObject) {

    return true
  }

  // updateObjects() {
  //   this.objectService.getObjects(this.machineTypes, this.materials, true).subscribe(objects => {
  //     this.objects = objects
  //     this.loading = false
  //   })
  // }
}
