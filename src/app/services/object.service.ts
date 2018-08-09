import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { OrderService } from './order.service';
import { map, filter } from 'rxjs/operators';
import { TdmObject } from '../models/object';
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

  /**
   * Returns all objects of the marketplace matching at least one of the machineTypes or materials.
   * If machineTypes and materials are empty, all objects are returned.
   * @param machineTypes array of machinetypes. Objects matching at least one of the machine types are returned.
   * @param materials array of materials. Objects matching at least one of the materials are returned.
   * @returns marketplace objects
   */
  getObjects(machineTypes: string[], materials: string[]) {
    const url = this.apiUrl + "objects";
    var params = {}

    // add language to query parameters
    params['lang'] = 'de'

    // add machine types to query parameters
    for (var i = 0; i < machineTypes.length; i += 1) {
      params['machines[' + i + ']'] = machineTypes[i]
    }

    // add materials to query parameters
    for (var i = 0; i < materials.length; i += 1) {
      params['materials[' + i + ']'] = materials[i]
    }

    return this.http.get<TdmObject[]>(url, {
      params: params
    })
  }

  /**
   * Queries the marketplace for the object with provied id.
   * @param id id of the object to return
   * @returns the object details for the corresponding id.
   */
  getObject(id: string) {
    const url = this.apiUrl + "objects";
    var params = {}

    // add language to query parameters
    params['lang'] = 'de'

    return this.http.get<TdmObject[]>(url, {
      params: params
    }).pipe(
      map(objects => objects.find(object => {
        return object.id === id
      }))
    )
  }

}
