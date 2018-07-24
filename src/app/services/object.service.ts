import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
// import { TdmObjectPrinterObject } from 'tdm-common';

@Injectable({
  providedIn: 'root'
})
export class ObjectService {
  apiUrl = "/api/"

  constructor(
    private http: HttpClient,
  ) { }

  // get 
  getObjects() {
    const url = this.apiUrl + "objects";
    return this.http.get<any[]>(url, {
      params: {
        "materials[0]": "763c926e-a5f7-4ba0-927d-b4e038ea2735",
        "machines[0]": "adb4c297-45bd-437e-ac90-a33d0f24de7e",
        "lang": "de"
      }
    })
  }

}
