import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {LocalObject} from '../../../models/localObject';
import {MaterialService} from '../../../services/material.service';
import {MachineService} from '../../../services/machine.service';
import {MaterialDefinition} from '../../../models/materialDefinition';
import {MachineType} from '../../../models/machineType';

@Component({
    selector: 'app-local-object-details',
    templateUrl: './local-object-details.component.html',
    styleUrls: ['./local-object-details.component.css']
})
export class LocalObjectDetailsComponent implements OnInit {
    @Input() object: LocalObject;

    materialDefinitions = new Array<MaterialDefinition>();
    machineTypes = new Array<MachineType>();

    constructor(private materialService: MaterialService, private machineService: MachineService) {
    }

    ngOnInit() {
        this.materialService.getAllMaterials().subscribe((materialDefinitions) => {
            this.materialDefinitions = materialDefinitions;
        });

        this.machineService.getMachineTypes().subscribe((machineTypes) => {
            this.machineTypes = machineTypes;
        });
    }


    materialNameForGuid(guid: string) {
        if (!guid) {
            return 'no material';
        }
        for (const material of this.materialDefinitions) {
            if (material.id === guid) {
                return material.name;
            }
        }
        return guid;
    }

    machineNameForId(guid: string) {
        if (!guid) {
            return 'no machine';
        }
        for (const machineType of this.machineTypes) {
            if (machineType.id === guid) {
                return machineType.name;
            }
        }
        return guid;
    }

}
