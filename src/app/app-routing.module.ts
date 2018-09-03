import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {MarketplaceComponent} from './tabs/marketplace/marketplace.component';
import {MachinesComponent} from './tabs/machines/machines.component';
import {PurchasedObjectsComponent} from './tabs/purchased-objects/purchased-objects.component';
import {OwnObjectsComponent} from './tabs/own-objects/own-objects.component';
import {ShoppingCartComponent} from './tabs/marketplace/shopping-cart/shopping-cart.component';
import {CreateObjectComponent} from './tabs/own-objects/create-object/create-object.component';
import {OrderComponent} from './tabs/marketplace/order/order.component';
import {ObjectDetailsComponent} from './object-details/object-details.component';

const routes: Routes = [
    {path: '', redirectTo: 'marketplace/', pathMatch: 'full'},
    {path: 'marketplace', redirectTo: 'marketplace/'},
    {path: 'marketplace/shoppingcart', component: ShoppingCartComponent},
    {path: 'marketplace/order', component: OrderComponent},
    {path: 'marketplace/:id', component: MarketplaceComponent},
    {path: 'machines', component: MachinesComponent},
    {path: 'purchased-objects', redirectTo: 'purchased-objects/'},
    {path: 'purchased-objects/:id', component: PurchasedObjectsComponent},
    {path: 'own-objects', component: OwnObjectsComponent},
    {path: 'own-objects/create', component: CreateObjectComponent},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
