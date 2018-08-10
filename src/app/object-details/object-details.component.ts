import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-object-details-actions',
  template: '<ng-content></ng-content>'
})
export class ObjectDetailsActionsComponent {
  constructor() { }
}

@Component({
  selector: 'app-object-details',
  templateUrl: './object-details.component.html',
  styleUrls: ['./object-details.component.css']
})
export class ObjectDetailsComponent implements OnInit {
  @Input() object: any

  constructor() { }

  ngOnInit() {
  }

}
