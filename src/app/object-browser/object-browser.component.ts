import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-object-browser',
  templateUrl: './object-browser.component.html',
  styleUrls: ['./object-browser.component.css']
})
export class ObjectBrowserComponent implements OnInit {
  @Input() objects: any[]
  @Output() onObjectSelected = new EventEmitter();
  
  constructor() { }

  ngOnInit() {
  }

  onObjectClick(object: any) {
    this.onObjectSelected.emit(object)
  }

}
