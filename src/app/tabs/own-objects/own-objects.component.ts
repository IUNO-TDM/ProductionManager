import { Component, OnInit } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { ObjectService } from '../../services/object.service';

@Component({
  selector: 'app-own-objects',
  templateUrl: './own-objects.component.html',
  styleUrls: ['./own-objects.component.css']
})
export class OwnObjectsComponent implements OnInit {
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
    this.titleService.setTitle("Eigene Objekte")
  }
}
