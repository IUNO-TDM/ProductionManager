import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
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
  orderStateConnection: Subscription = null

  constructor(
    private router: Router,
    private orderService: OrderService,
    private zone: NgZone,
    private ordersSocketService: OrdersSocketService,
    private objectService: ObjectService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    orderService.getOpenOrders().subscribe(orders => {
      if (orders.length > 0) {
        this.order = orders[0]
        this.bip21 = this.order.offer.bip21
        const amount = this.bip21.match("[\\?\\&]amount=(\\d+\\.?\\d+)")
        if (amount.length == 2) {
          this.amount = +amount[1] // + does convert the string into a number.
        }
        this.startObservingOrderUpdated(this.order)
      } else {
        this.router.navigateByUrl('marketplace')
      }
    })
  }

  onUpdateLicenseClicked() {
    this.orderService.updateLicense(this.order).subscribe(order => {
      //FIXME: handle result
    })
  }

  onCancelOrderClicked() {
    this.orderService.cancelOrder(this.order).subscribe(order => {
      this.router.navigateByUrl('marketplace')
    })
  }

  onPurchasedObjectsClicked() {
    setTimeout(() => {
      this.router.navigateByUrl("purchased-objects")
    }, 0)
  }

  private startObservingOrderUpdated(order: Order) {
    // this.orderProgressConnection = this.ordersSocketService.getUpdates('progress')
    //   .subscribe(progress => {
    //     if (progress.orderNumber === this.order.id) {
    //       this.progress = progress.progress;
    //     }

    //     return this.progress;
    //   });
    this.orderStateConnection =
      this.ordersSocketService.getUpdates('state')
        .subscribe(state => {
          console.log("--- status update ---")
          console.log("this.order.id = " + this.order.id)
          console.log(state)
          if (state.orderNumber === this.order.id) {
            this.zone.run(() => {
              this.order.state = state.toState
              // this.changeDetectorRef.detectChanges()
            });
            // setTimeout(() => {
            //   this.order.state = state.toState
            //   this.changeDetectorRef.detectChanges()
            //   console.log("Setting orderstate to "+state.toState)
            // }, 0)
            // if (state.toState == 'completed') {
            //   this.router.navigateByUrl('purchased-objects')
            // }
            // if (state.toState !== 'waitingPayment') {
            //   if (this.qrDialogRef) {
            //     this.qrDialogRef.close();
            //   }
            //   if (this.scanDialogRef) {
            //     this.scanDialogRef.close();
            //   }
            // }
            //   if (state.toState === 'productionFinished') {
            //     this.redirectTimerObservable = Observable.timer(10000, 50000);
            //     this.redirectTimerSubscription = this.redirectTimerObservable.subscribe(x => {
            //       this.router.navigateByUrl('/');
            //       this.redirectTimerSubscription.unsubscribe();
            //     });
            //   }
            //   // state.toState = 'productionFinished'
            //   this.refreshStepCards(state);
            //   return this.orderState = state;
          }

        });

    this.ordersSocketService.joinRoom(String(this.order.id));


  }

  ngOnInit() {

  }

}
