import { Component, OnInit, Input } from '@angular/core';
import { Machine } from '../../../models/machine';

@Component({
  selector: 'app-machine',
  templateUrl: './machine.component.html',
  styleUrls: ['./machine.component.css']
})
export class MachineComponent implements OnInit {
  @Input() machine: Machine;
  
  constructor() { }

  ngOnInit() {
  }

}
