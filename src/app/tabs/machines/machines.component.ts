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
    })
  }

  ngAfterViewInit() {
    this.titleService.setTitle("Maschinen")
  }
}
