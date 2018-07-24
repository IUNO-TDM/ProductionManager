import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MarketplaceComponent } from './tabs/marketplace/marketplace.component';
import { MachinesComponent } from './tabs/machines/machines.component';
import { PurchasedObjectsComponent } from './tabs/purchased-objects/purchased-objects.component';
import { OwnObjectsComponent } from './tabs/own-objects/own-objects.component';

const routes: Routes = [
    {path: '', redirectTo: 'marketplace', pathMatch: 'full'},
    {path: 'marketplace', component: MarketplaceComponent},
    {path: 'machines', component: MachinesComponent},
    {path: 'purchased-objects', component: PurchasedObjectsComponent},
    {path: 'own-objects', component: OwnObjectsComponent},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
