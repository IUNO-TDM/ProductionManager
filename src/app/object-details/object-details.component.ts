import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-object-details',
  templateUrl: './object-details.component.html',
  styleUrls: ['./object-details.component.css']
})
export class ObjectDetailsComponent implements OnInit {
  @Input() object: any
  @Input() canAddToShoppingCart: boolean = false
  @Output() onAddToShoppingCart = new EventEmitter;
  
  constructor() { }

  ngOnInit() {
  }

  addToShoppingCart() {
    this.onAddToShoppingCart.emit(this.object)
  }

}
