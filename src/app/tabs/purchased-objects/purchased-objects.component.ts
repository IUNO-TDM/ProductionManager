import { Component, OnInit } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { ObjectService } from '../../services/object.service';
import { MachineService } from '../../services/machine.service';

@Component({
  selector: 'app-purchased-objects',
  templateUrl: './purchased-objects.component.html',
  styleUrls: ['./purchased-objects.component.css']
})
export class PurchasedObjectsComponent implements OnInit {
  objects: any[] = []
  materials = ['763c926e-a5f7-4ba0-927d-b4e038ea2735']
  machineTypes = []
  selectedObject: any = null
  loading = true

  constructor(
    private titleService: TitleService,
    private objectService: ObjectService,
    private machineService: MachineService,
  ) {
    this.objectService.getPurchasedObjectIds().subscribe(items => {
      console.log("ITEMS:")
      console.log(items)
    })
    // this.machineService.getMachineTypes().subscribe(machineTypes => {
    //   this.machineTypes = machineTypes.map(type => type.id)
    //   this.updateObjects()      
    // })
  }

  ngOnInit() {
  }


  ngAfterViewInit() {
    this.titleService.setTitle("Gekaufte Objekte")
  }

  onObjectSelected(object) {
    this.selectedObject = object
  }

  deselectObject() {
    this.selectedObject = null;
  }

  updateObjects() {
    this.objectService.getObjects(this.machineTypes, this.materials).subscribe(objects => {
      this.objects = objects
      this.loading = false
    })
  }
}
