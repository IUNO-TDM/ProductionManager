import { Component, OnInit, Input } from '@angular/core';

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
