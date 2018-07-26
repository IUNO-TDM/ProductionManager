import { Component, OnInit } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { ObjectService } from '../../services/object.service';
import { MachineService } from '../../services/machine.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-own-objects',
  templateUrl: './own-objects.component.html',
  styleUrls: ['./own-objects.component.css']
})
export class OwnObjectsComponent implements OnInit {
  objects: any[] = []
  materials = ['763c926e-a5f7-4ba0-927d-b4e038ea2735']
  machineTypes = []
  selectedObject: any = null
  loading = true

  constructor(
    private router: Router,
    private titleService: TitleService,
    private objectService: ObjectService,
    private machineService: MachineService
  ) { 
    this.machineService.getMachineTypes().subscribe(machineTypes => {
      this.machineTypes = machineTypes.map(type => type.id)
      this.updateObjects()
    })
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.titleService.setTitle("Eigene Objekte")
  }

  onAddObjectClicked() {
    this.router.navigateByUrl('own-objects/create')
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
