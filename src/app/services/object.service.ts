import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { OrderService } from './order.service';
import { map, filter } from 'rxjs/operators';
import { TdmObject } from '../models/object';
import { Observable, BehaviorSubject } from 'rxjs';
import { DownloadSocketService } from './download-socket.service';
// import { TdmObjectPrinterObject } from 'tdm-common';

export class DownloadState {
  state: string = 'unknown'
  bytesTotal: number = -1
  bytesDownloaded: number = -1

  /**
   * Constructor of DownloadState
   * @param downloadState dictionary with state and downloading stats. Can be null.
   */
  constructor(downloadState) {
    if (downloadState) {
      this.state = downloadState.state
      this.bytesTotal = downloadState.bytesTotal
      this.bytesDownloaded = downloadState.bytesDownloaded
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class ObjectService {
  apiUrl = "/api/"
  downloadStates = {}

  constructor(
    private http: HttpClient,
    private orderService: OrderService,
    private downloadSocketService: DownloadSocketService
  ) { }

  /**
   * Returns all objects of the marketplace matching at least one of the machineTypes or materials.
   * If machineTypes and materials are empty, all objects are returned.
   * @param machineTypes array of machinetypes. Objects matching at least one of the machine types are returned.
   * @param materials array of materials. Objects matching at least one of the materials are returned.
   * @param purchased boolean value. If true, only objects that were purchased at some times are returned.
   * @returns marketplace objects
   */
  getObjects(machineTypes: string[], materials: string[], purchased: boolean) {
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

    params['purchased'] = purchased ? 'true' : 'false'

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

  /**
   * Tells the backend to start downloading the binary file for the provided object id.
   * @param id object id of the object for which the binary should be downloaded
   * @returns an observable containing the request.
   */
  startDownloadingBinary(id: string) {
    const url = this.apiUrl + "objects/"+id+"/binary";
    return this.http.get(url)
  }

  /**
   * Returns a BehaviorSubject for the download state of the provided object id.
   * The value of the subject is updated when the download state changes (e.g. while downloading).
   * @param id object id 
   * @returns a BehaviorSubject for the download state of the provided object id. The initial value of the subject is null.
   */
  getDownloadState(id: string): BehaviorSubject<DownloadState> {
    var downloadState: BehaviorSubject<DownloadState> = this.downloadStates[id]
    if (!downloadState) {
      // No download state available. Create a new BehaviorSubject and join
      // the socket.id room for state change events of the provided object id.
      downloadState = new BehaviorSubject<DownloadState>(null)
      this.downloadStates[id] = downloadState
      //FIXME: move this to constructor to only subscribe once?
      this.downloadSocketService.getUpdates('state_change').subscribe(state => {
        if (state.id === id) {
          downloadState.next(new DownloadState(state))
        }
      })
      this.downloadSocketService.joinRoom(id)
    }
    return downloadState
  }
}
