import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-object-browser',
  templateUrl: './object-browser.component.html',
  styleUrls: ['./object-browser.component.css']
})
export class ObjectBrowserComponent implements OnInit {
  @Input() objects: any[]
  
  constructor() { }

  ngOnInit() {
  }

}
