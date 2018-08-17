import { Component } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { TitleService } from './services/title.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  navigationTitle = "t";

  constructor(
    private router: Router,
    private titleService: TitleService
  ) {
    titleService.title.subscribe(title => {
      this.navigationTitle = title;
    });
  }

  onMarketplaceButtonClicked() {
    this.router.navigateByUrl('marketplace');
  }

  onMachinesButtonClicked() {
    this.router.navigateByUrl('machines');
  }

  onPurchasedObjectsButtonClicked() {
    this.router.navigateByUrl('purchased-objects');
  }

  onOwnObjectsButtonClicked() {
    this.router.navigateByUrl('own-objects');
  }
}

