import { Component, OnInit } from '@angular/core';
import { ShoppingCartService, ShoppingCartItem } from '../../../services/shopping-cart.service';
import { MachineService } from '../../../services/machine.service';
import { Machine } from '../../../models/machine';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent implements OnInit {
  items: ShoppingCartItem[] = []
  machines: Machine[] = []
  selectedMachine: string = null

  constructor(
    private shoppingCartService: ShoppingCartService,
    private machineService: MachineService
  ) { }

  ngOnInit() {
    this.shoppingCartService.items.subscribe(items => {
      this.items = items
    })

    this.machineService.machines.subscribe(machines => {
      this.machines = machines
      if (!this.selectedMachine && machines.length > 0) {
        this.selectedMachine = machines[0]._id
        console.log("Hallo")
        console.log(this.selectedMachine)
      }
      console.log(machines)
    })
  }

  onRemoveItem(item) {
    this.shoppingCartService.removeItem(item).subscribe(result => {
    })
  }

  onOrderClicked() {
    console.log(this.selectedMachine)
  }

}
