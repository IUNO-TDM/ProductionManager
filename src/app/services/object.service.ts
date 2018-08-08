import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { OrderService } from './order.service';
import { map } from '../../../node_modules/rxjs/operators';
// import { TdmObjectPrinterObject } from 'tdm-common';

@Injectable({
  providedIn: 'root'
})
export class ObjectService {
  apiUrl = "/api/"

  constructor(
    private http: HttpClient,
    private orderService: OrderService
  ) { }

  // get 
  getObjects(machineTypes: string[], materials: string[]) {
    const url = this.apiUrl + "objects";
    var params = {}

    // add language to query parameters
    params['lang'] = 'de'

    // add machine types to query parameters
    for (var i = 0; i < machineTypes.length; i += 1) {
      params['machines['+i+']'] = machineTypes[i]
    }

    // add materials to query parameters
    for (var i = 0; i < materials.length; i += 1) {
      params['materials['+i+']'] = materials[i]
    }

    return this.http.get<any[]>(url, {
      params: params
    })
  }

  /**
   * Returns a list of purchased objectIds. Therefore all completed orders are requested and
   * the objectIds of this orders are collected.
   * @param 
   * @returns list of purchased objectIds
   */
  getPurchasedObjectIds() {
    return this.orderService.getCompletedOrders().pipe(
      map(orders => orders.map(order => order.items))
    )
  }

}
