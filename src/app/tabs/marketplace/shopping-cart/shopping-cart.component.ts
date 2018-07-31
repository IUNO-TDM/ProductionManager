import { Component, OnInit } from '@angular/core';
import { ShoppingCartService, ShoppingCartItem } from '../../../services/shopping-cart.service';
import { MachineService } from '../../../services/machine.service';
import { Machine } from '../../../models/machine';
import { OrderService } from '../../../services/order.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent implements OnInit {
  items: ShoppingCartItem[] = []
  machines: Machine[] = []
  selectedMachineId: string = null

  constructor(
    private router: Router,
    private shoppingCartService: ShoppingCartService,
    private machineService: MachineService,
    private orderService: OrderService
  ) { }

  ngOnInit() {
    this.shoppingCartService.items.subscribe(items => {
      this.items = items
    })

    this.machineService.machines.subscribe(machines => {
      this.machines = machines
      if (!this.selectedMachineId && machines.length > 0) {
        this.selectedMachineId = machines[0]._id
      }
    })
  }

  onRemoveItem(item) {
    this.shoppingCartService.removeItem(item).subscribe(result => {
    })
  }

  onBackButtonClicked() {
    this.router.navigateByUrl('marketplace')
  }

  onOrderClicked() {
    this.shoppingCartService.order(this.selectedMachineId).subscribe(result => {
      this.router.navigateByUrl('marketplace')
    })
    console.log(this.selectedMachineId)
  }

}
