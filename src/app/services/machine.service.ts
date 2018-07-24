import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Machine } from '../models/machine'
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  apiUrl = "/api/"

  private _machines: BehaviorSubject<Machine[]> = new BehaviorSubject([])
  public readonly machines: Observable<Machine[]> = this._machines.asObservable()

  constructor(
    private http: HttpClient,
  ) {

  }

  updateMachines() {
    const url = this.apiUrl + "machines";
    this.http.get<Machine[]>(url).subscribe(machines => {
      this._machines.next(machines)
      machines
    })
  }
}
