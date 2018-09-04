import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Machine} from '../models/machine';
import {BehaviorSubject} from 'rxjs';
import {Observable} from 'rxjs';
import {MachineType} from '../models/machineType';
import {Material} from '../models/material';

@Injectable({
    providedIn: 'root'
})
export class MachineService {
    apiUrl = '/api/';

    private _machines: BehaviorSubject<Machine[]> = new BehaviorSubject([]);
    public readonly machines: Observable<Machine[]> = this._machines.asObservable();

    constructor(
        private http: HttpClient,
    ) {
        this.updateMachines(null);
    }

    updateMachines(callback) {
        const url = this.apiUrl + 'machines';
        this.http.get<Machine[]>(url).subscribe(machines => {
            this._machines.next(machines);
            if (callback) {
                callback();
            }
        });
    }

    getCameraSnapshot(machine) {
        const url = this.apiUrl + 'machines/' + machine.id + '/camera/snapshot';
        return this.http.get(url, {responseType: 'blob'});
    }

    getMachineTypes(): Observable<MachineType[]> {
        const url = this.apiUrl + 'machinetypes';
        return this.http.get<MachineType[]>(url, {
            params: {
                lang: 'de'
            }
        });
    }

    getMaterialTypes(): Observable<any[]> {
        const url = this.apiUrl + 'materials';
        return this.http.get<Material[]>(url, {
            params: {
                lang: 'de'
            }
        });
    }

    getAuthenticated(machineId: string) {
        const url = this.apiUrl + 'machines/' + machineId + '/authentication';
        return this.http.get(url);
    }

    requestAuthentication(machineId: string) {
        const url = this.apiUrl + 'machines/' + machineId + '/authentication';
        return this.http.post(url, '', {responseType: 'text'});
    }

    getMaterials(machineId: string): Observable<Array<Material>> {
        const url = this.apiUrl + 'machines/' + machineId + '/materials/active';
        return this.http.get<Array<Material>>(url);

    }

    getStatus(machineId: string) {

        const url = this.apiUrl + 'machines/' + machineId + '/status';
        return this.http.get(url, {responseType: 'text'});
    }

    getLicenseCount(machineId: string, productCode: string) {
        const url = this.apiUrl + 'machines/' + machineId + '/hsm/all/productcodes/' + productCode;

        return this.http.get(url, {responseType: 'text'});
    }

}
