import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MarketplaceComponent } from './tabs/marketplace/marketplace.component';
import { MachinesComponent } from './tabs/machines/machines.component';
import { PurchasedObjectsComponent } from './tabs/purchased-objects/purchased-objects.component';
import { OwnObjectsComponent } from './tabs/own-objects/own-objects.component';
import { ShoppingCartComponent } from './tabs/marketplace/shopping-cart/shopping-cart.component';
import { CreateObjectComponent } from './tabs/own-objects/create-object/create-object.component';
import { OrderComponent } from './tabs/marketplace/order/order.component';

const routes: Routes = [
    {path: '', redirectTo: 'marketplace', pathMatch: 'full'},
    {path: 'marketplace', component: MarketplaceComponent},
    {path: 'marketplace/shoppingcart', component: ShoppingCartComponent},
    {path: 'marketplace/order', component: OrderComponent},
    {path: 'machines', component: MachinesComponent},
    {path: 'purchased-objects', component: PurchasedObjectsComponent},
    {path: 'own-objects', component: OwnObjectsComponent},
    {path: 'own-objects/create', component: CreateObjectComponent},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
