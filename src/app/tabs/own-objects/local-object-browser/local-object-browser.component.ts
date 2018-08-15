import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {LocalObject} from '../../../models/localObject';

@Component({
    selector: 'app-local-object-browser',
    templateUrl: './local-object-browser.component.html',
    styleUrls: ['./local-object-browser.component.css']
})
export class LocalObjectBrowserComponent implements OnInit {
    @Input() objects: Array<LocalObject>;
    @Output() onObjectSelected = new EventEmitter();

    constructor() {
    }

    ngOnInit() {
    }

    onObjectClick(object: any) {
        this.onObjectSelected.emit(object);
    }

}
