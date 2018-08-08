import { Component, OnInit } from '@angular/core';
import { MachineService } from '../../services/machine.service';
import { Machine } from '../../models/machine';
import { TitleService } from '../../services/title.service';

@Component({
  selector: 'app-machines',
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.css']
})
export class MachinesComponent implements OnInit {
  machines: Machine[]

  constructor(
    private titleService: TitleService,
    private machineService: MachineService,
  ) { }

  ngOnInit() {
    this.machineService.machines.subscribe(machines => {
      this.machines = machines
      this.machines.forEach(machine => {
        this.machineService.getCameraSnapshot(machine).subscribe(imageData => {
          this.createImageFromBlob(imageData, machine);
        })
      })
    })
  }

  ngAfterViewInit() {
    this.titleService.setTitle("Maschinen")
  }

  // https://stackoverflow.com/a/45630579/1771537
  createImageFromBlob(image: Blob, machine: Machine) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      machine.cameraSnapshot = reader.result
    }, false); 
    if (image) {
       reader.readAsDataURL(image);
    }
 }
}
