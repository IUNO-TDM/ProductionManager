import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Machine} from '../models/machine';
import {BehaviorSubject} from 'rxjs';
import {Observable} from 'rxjs';
import {of} from 'rxjs';
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
        console.log('updating machines with url: ' + url);
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
        return of([
            {
                id: 'a02967f3-dc62-495f-bab4-f7132bc2596a',
                name: 'PLA'
            },
            {
                id: '86a89ceb-4159-47f6-ab97-e9953803d70f',
                name: 'Generic PVA Generic'
            },
            {
                id: '763c926e-a5f7-4ba0-927d-b4e038ea2735',
                name: 'Ultimaker ABS Silver Metallic'
            },
            {
                id: '5df7afa6-48bd-4c19-b314-839fe9f08f1f',
                name: 'Ultimaker ABS Red'
            }
        ]);
    }

    updateMachineType() {
    }

    getAuthenticated(machineId: string) {
        const url = this.apiUrl + 'machines/' + machineId + '/authentication';
        return this.http.get(url);
    }

    requestAuthentication(machineId: string) {
        const url = this.apiUrl + 'machines/' + machineId + '/authentication';
        return this.http.post(url, '');
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
