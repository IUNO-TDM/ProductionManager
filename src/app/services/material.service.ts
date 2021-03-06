import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {MaterialDefinition} from '../models/materialDefinition';

@Injectable({
    providedIn: 'root'
})
export class MaterialService {
    apiUrl = '/api/materials';

    constructor(
        private http: HttpClient
    ) {
    }

    getAllMaterials(hierarchical: boolean): Observable<Array<MaterialDefinition>> {
        const url = this.apiUrl + (hierarchical ? '/hierarchical' : '');

        const params = {};
        // add language to query parameters
        params['lang'] = 'de';
        return this.http.get<Array<MaterialDefinition>>(url, {
            params: params
        });

    }


}