import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {LocalObject} from '../models/localObject';
import {Observable} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LocalObjectService {
    private apiUrl = '/api/localobjects';

    constructor(
        private http: HttpClient,
    ) {
    }

    getObjects(): Observable<Array<LocalObject>> {
        const url = this.apiUrl;

        return this.http.get<Array<LocalObject>>(url);
    }

    deleteObject(objectId: string) {
        const url = this.apiUrl + '/' + objectId;

        return this.http.delete(url,{responseType: 'text'});
    }

    publishObject(objectId: string, data: {}) {
        const url = this.apiUrl + '/' + objectId + '/publish';
        const body = data
        return this.http.post(url, body, {responseType: 'text'})
    }

}
