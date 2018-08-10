import { Component, OnInit } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { ObjectService } from '../../services/object.service';
import { MachineService } from '../../services/machine.service';
import { OrderService } from '../../services/order.service';
import { Observable } from 'rxjs';
import { forkJoin } from "rxjs";
import { TdmObject } from '../../models/object';

@Component({
  selector: 'app-purchased-objects',
  templateUrl: './purchased-objects.component.html',
  styleUrls: ['./purchased-objects.component.css']
})
export class PurchasedObjectsComponent implements OnInit {
  objects: TdmObject[] = []
  materials = ['763c926e-a5f7-4ba0-927d-b4e038ea2735']
  machineTypes = []
  selectedObject: any = null
  loading = true
  orders = []

  constructor(
    private titleService: TitleService,
    private objectService: ObjectService,
    private orderService: OrderService,
    private machineService: MachineService,
  ) {
    this.orderService.getCompletedOrders().subscribe(orders => {
      this.orders = orders
      var objectIds = this.getObjectIds()
      var observables = []
      Object.keys(objectIds).forEach(id => {
        observables.push(objectService.getObject(id))
      })
      forkJoin(observables).subscribe(results => {
        this.objects = results
        this.loading = false
      })
    })
  }

  /**
   * Returns a dictionary containing object-ids and accumulated amounts of all completed orders.
   * @returns a dictionary containing object-ids and accumulated amounts of all completed orders.
   */
  getObjectIds() {
    var ids = {}
    this.orders.forEach(order => {
      order.items.forEach(item => {
        var amount = item.amount
        if (ids[item.dataId]) {
          amount += ids[item.dataId]
        }
        ids[item.dataId] = amount
      })
    })
    return ids
  }

  ngOnInit() {
  }


  ngAfterViewInit() {
    this.titleService.setTitle("Gekaufte Objekte")
  }

  onObjectSelected(object) {
    this.selectedObject = object
  }

  onDownloadClicked() {
    //FIXME: Implement this!
    console.log("Download!")
  }

  deselectObject() {
    this.selectedObject = null;
  }

  updateObjects() {
    this.objectService.getObjects(this.machineTypes, this.materials).subscribe(objects => {
      this.objects = objects
      this.loading = false
    })
  }
}
