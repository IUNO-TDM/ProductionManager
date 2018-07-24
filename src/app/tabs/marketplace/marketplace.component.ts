import { Component, OnInit } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { ObjectService } from '../../services/object.service';

@Component({
  selector: 'app-marketplace',
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.css']
})
export class MarketplaceComponent implements OnInit {
  objects: any[] = []

  constructor(
    private titleService: TitleService,
    private objectService: ObjectService
  ) { }

  ngOnInit() {
    this.objectService.getObjects().subscribe(objects => {
      this.objects = objects
    })
  }


  ngAfterViewInit() {
    this.titleService.setTitle("Marktplatz")
  }
}
