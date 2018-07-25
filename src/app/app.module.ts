// Angular Core imports
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexModule } from '@angular/flex-layout';
import { CommonModule } from "@angular/common";
import { HttpClientModule } from '@angular/common/http'

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Production Manager imports
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MarketplaceComponent } from './tabs/marketplace/marketplace.component';
import { MachinesComponent } from './tabs/machines/machines.component';
import { OwnObjectsComponent } from './tabs/own-objects/own-objects.component';
import { PurchasedObjectsComponent } from './tabs/purchased-objects/purchased-objects.component';
import { ObjectBrowserComponent } from './object-browser/object-browser.component';
// import { TdmCommonModule } from 'tdm-common'

@NgModule({
  declarations: [
    AppComponent,
    MarketplaceComponent,
    MachinesComponent,
    OwnObjectsComponent,
    PurchasedObjectsComponent,
    ObjectBrowserComponent,
  ],
  imports: [
    // Angular Core
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexModule,
    HttpClientModule,

    // Angular Material
    MatToolbarModule,
    MatTabsModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,

    // Product Manager Modules
    AppRoutingModule,
    // TdmCommonModule,

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
