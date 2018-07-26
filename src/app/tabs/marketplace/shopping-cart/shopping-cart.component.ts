import { Component, OnInit } from '@angular/core';
import { ShoppingCartService, ShoppingCartItem } from '../../../services/shopping-cart.service';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent implements OnInit {
  items: ShoppingCartItem[] = []

  constructor(
    private shoppingCartService: ShoppingCartService
  ) { }

  ngOnInit() {
    this.shoppingCartService.items.subscribe(items => {
      console.log(items)
      this.items = items
    })
  }

  onRemoveItem(item) {
    this.shoppingCartService.removeItem(item).subscribe(result => {
    })
  }

}
