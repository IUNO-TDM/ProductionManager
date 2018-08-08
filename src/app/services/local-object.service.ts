import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class LocalObjectService {
    apiUrl = '/api/';

    constructor(
        private http: HttpClient,
    ) {
    }

    getObjects(machineTypes: string[], materials: string[]) {
        const url = this.apiUrl + 'objects/local';
        var params = {};

        // add language to query parameters
        params['lang'] = 'de';

        // add machine types to query parameters
        for (var i = 0; i < machineTypes.length; i += 1) {
            params['machines[' + i + ']'] = machineTypes[i];
        }

        // add materials to query parameters
        for (var i = 0; i < materials.length; i += 1) {
            params['materials[' + i + ']'] = materials[i];
        }

        return this.http.get<any[]>(url, {
            params: params
        });
    }

}
