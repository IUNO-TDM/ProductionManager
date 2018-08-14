import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {LocalObject} from '../models/localObject';
import {Observable} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LocalObjectService {
    apiUrl = '/api/';

    constructor(
        private http: HttpClient,
    ) {
    }

    getObjects(): Observable<Array<LocalObject>> {
        const url = this.apiUrl + 'localobjects';

        return this.http.get<Array<LocalObject>>(url);
    }

}
