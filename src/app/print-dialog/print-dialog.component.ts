import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatRadioChange} from '@angular/material';
import {LocalObject} from '../models/localObject';
import {FormBuilder} from '@angular/forms';
import {TdmObject} from '../models/object';
import {MachineService} from '../services/machine.service';
import {Machine} from '../models/machine';
import {MaterialService} from '../services/material.service';
import {ObjectService} from '../services/object.service';
import {LocalObjectService} from '../services/local-object.service';

@Component({
    selector: 'app-print-dialog',
    templateUrl: './print-dialog.component.html',
    styleUrls: ['./print-dialog.component.css']
})
export class PrintDialogComponent implements OnInit {
    private localObject: LocalObject;
    private tdmObject: TdmObject;
    private machines: Array<Machine>;
    private selectedMachine: Machine;
    private stati = {};
    private materials = {};
    private licenseCounts = {};

    materialDefinitions = [];

    constructor(public dialogRef: MatDialogRef<PrintDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any, formBuilder: FormBuilder, private machineService: MachineService,
                private materialService: MaterialService, private objectService: ObjectService,
                private localObjectService: LocalObjectService) {

        if (data.localObject) {
            this.localObject = data.localObject;
        } else if (data.tdmObject) {
            this.tdmObject = data.tdmObject;
        }


        this.machineService.updateMachines(() => {
            this.machineService.machines.subscribe(machines => {
                this.machines = machines;
            });
        });

        this.materialService.getAllMaterials(false).subscribe((materialDefinitions) => {
            this.materialDefinitions = materialDefinitions;
        });
    }

    ngOnInit() {
    }

    machineSelectionChanged(event: MatRadioChange) {
        if (event.value.isOnline) {
            this.machineService.getStatus(event.value.id).subscribe((status) => {
                this.stati[event.value.id] = status;
            });

            this.machineService.getMaterials(event.value.id).subscribe((materials) => {
                this.materials[event.value.id] = materials;
            });
            if (this.tdmObject) {
                this.machineService.getLicenseCount(event.value.id, '' + this.tdmObject.productCode).subscribe((count) => {
                    this.licenseCounts[event.value.id] = count;
                });
            }
        }


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

    printObject() {
        if (!this.selectedMachine) {
            return;
        }
        if (this.localObject) {
            this.localObjectService.printObject(this.localObject.id, this.selectedMachine.id).subscribe(() => {
                this.dialogRef.close();
            });
        } else {
            this.objectService.printObject(this.tdmObject.id, this.selectedMachine.id).subscribe(() => {
                this.dialogRef.close();
            });
        }
    }
}
