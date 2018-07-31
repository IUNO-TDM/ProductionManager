import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../models/order';
import { Router } from '@angular/router';
import { ObjectService } from '../../../services/object.service';
import { OrdersSocketService } from '../../../services/orders-socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {
  order: Order = null
  bip21: String = null
  amount: Number = null
  orderProgressConnection: Subscription = null

  constructor(
    private router: Router,
    private orderService: OrderService,
    private ordersSocketService: OrdersSocketService,
    private objectService: ObjectService
  ) {
    orderService.getOpenOrders().subscribe(orders => {
      if (orders.length > 0) {
        this.order = orders[0]
        this.bip21 = this.order.offer.bip21
        const amount = this.bip21.match("[\\?\\&]amount=(\\d+\\.?\\d+)")
        if (amount.length == 2) {
          this.amount = +amount[1] // + does convert the string into a number.
        }
        console.log(this.amount)
        console.log(this.order)
        console.log(this.order.offer.bip21)
        this.ordersSocketService.joinRoom(String(this.order.id));
      } else {
        this.router.navigateByUrl('marketplace')
      }
    })
  }

  ngOnInit() {

  }

}
