import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Observable} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TitleService {
    private _title: BehaviorSubject<string> = new BehaviorSubject('');
    public readonly title: Observable<string> = this._title.asObservable();

    constructor() {
    }

    setTitle(title: string) {
        this._title.next(title);
    }
}
