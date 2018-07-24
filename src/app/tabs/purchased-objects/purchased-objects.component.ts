import { Component, OnInit } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { ObjectService } from '../../services/object.service';

@Component({
  selector: 'app-purchased-objects',
  templateUrl: './purchased-objects.component.html',
  styleUrls: ['./purchased-objects.component.css']
})
export class PurchasedObjectsComponent implements OnInit {
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
    this.titleService.setTitle("Gekaufte Objekte")
  }
}
