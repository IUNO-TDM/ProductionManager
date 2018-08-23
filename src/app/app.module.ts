// Angular Core imports
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule, FlexModule} from '@angular/flex-layout';
import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {NgxQRCodeModule} from 'ngx-qrcode2';

// Angular Material imports
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatListModule} from '@angular/material/list';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDialogModule} from '@angular/material/dialog';

// Production Manager imports
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {MarketplaceComponent} from './tabs/marketplace/marketplace.component';
import {MachinesComponent} from './tabs/machines/machines.component';
import {OwnObjectsComponent} from './tabs/own-objects/own-objects.component';
import {PurchasedObjectsComponent} from './tabs/purchased-objects/purchased-objects.component';
import {ObjectBrowserComponent} from './object-browser/object-browser.component';
import {ObjectDetailsComponent, ObjectDetailsActionsComponent} from './object-details/object-details.component';
import {ShoppingCartComponent} from './tabs/marketplace/shopping-cart/shopping-cart.component';
import {CreateObjectComponent} from './tabs/own-objects/create-object/create-object.component';
import {ConfirmationDialogComponent} from './confirmation-dialog/confirmation-dialog.component';
import {OrderComponent} from './tabs/marketplace/order/order.component';
import {MachineComponent} from './tabs/machines/machine/machine.component';
import {LocalObjectDetailsComponent} from './tabs/own-objects/local-object-details/local-object-details.component';
import {LocalObjectBrowserComponent} from './tabs/own-objects/local-object-browser/local-object-browser.component';
import {PublishDialogComponent} from './publish-dialog/publish-dialog.component';
import {MatFormFieldModule, MatSelectModule, MatTreeModule} from '@angular/material';
import {PrintDialogComponent} from './print-dialog/print-dialog.component';
import {CdkTreeModule} from '@angular/cdk/tree';

// import { TdmCommonModule } from 'tdm-common'

@NgModule({
    declarations: [
        AppComponent,
        MarketplaceComponent,
        MachinesComponent,
        OwnObjectsComponent,
        PurchasedObjectsComponent,
        ObjectBrowserComponent,
        ObjectDetailsComponent,
        LocalObjectDetailsComponent,
        LocalObjectBrowserComponent,
        ObjectDetailsActionsComponent,
        ShoppingCartComponent,
        CreateObjectComponent,
        ConfirmationDialogComponent,
        OrderComponent,
        MachineComponent,
        PublishDialogComponent,
        PrintDialogComponent
    ],
    imports: [
        // Angular Core
        BrowserModule,
        BrowserAnimationsModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        HttpClientModule,
        NgxQRCodeModule,

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
        MatRadioModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTreeModule,
        CdkTreeModule,
        // Product Manager Modules
        AppRoutingModule,
        // TdmCommonModule,

    ],
    entryComponents: [
        ConfirmationDialogComponent,
        PublishDialogComponent,
        PrintDialogComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
