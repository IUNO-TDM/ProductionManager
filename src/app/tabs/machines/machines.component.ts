import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {MachineService} from '../../services/machine.service';
import {Machine} from '../../models/machine';
import {TitleService} from '../../services/title.service';

@Component({
    selector: 'app-machines',
    templateUrl: './machines.component.html',
    styleUrls: ['./machines.component.css']
})
export class MachinesComponent implements OnInit, OnDestroy, AfterViewInit {
    private updateCameraSnapshotsInterval = 1000;
    private updateCameraSnapshotsErrorInterval = 10000;
    private updateCameraSnapshots = true;
    machines: Machine[];
    cameraSnapshotStates = {};
    selectedMachine = null;

    constructor(
        private titleService: TitleService,
        private machineService: MachineService,
    ) {
    }

    ngOnInit() {

        this.machineService.updateMachines(null);
        this.machineService.machines.subscribe(machines => {
            this.machines = machines;
            this.machines.forEach(machine => {
                if (machine.isOnline) {
                    this.startUpdatingCameraSnapshot(machine);
                }

            });
            // this.updateCameraSnapshots()
        });
    }

    ngAfterViewInit() {
        this.titleService.setTitle('Maschinen');
    }

    ngOnDestroy() {
        this.updateCameraSnapshots = false;
    }

    onMachineClick(machine) {
        this.selectedMachine = machine;
    }

    deselectMachine() {
        this.selectedMachine = null;
        this.machineService.updateMachines(null);
    }

    private startUpdatingCameraSnapshot(machine) {
        if (this.updateCameraSnapshots) {
            this.cameraSnapshotStates[machine.id] = 'updating';
            this.machineService.getCameraSnapshot(machine).subscribe(
                imageData => {
                    this.cameraSnapshotStates[machine.id] = 'ready';
                    this.createImageFromBlob(imageData, machine);
                    setTimeout(() => {
                        this.startUpdatingCameraSnapshot(machine);
                    }, this.updateCameraSnapshotsInterval);
                },
                error => {
                    this.cameraSnapshotStates[machine.id] = 'not available';
                    setTimeout(() => {
                        this.startUpdatingCameraSnapshot(machine);
                    }, this.updateCameraSnapshotsErrorInterval);
                }
            );
        }
    }

    // private updateCameraSnapshots() {
    //   this.machines.forEach(machine => {
    //     this.machineService.getCameraSnapshot(machine).subscribe(imageData => {
    //       this.createImageFromBlob(imageData, machine);
    //     })
    //   })
    //   setTimeout(() => {
    //     this.updateCameraSnapshots()
    //   }, 5000)
    // }

    // https://stackoverflow.com/a/45630579/1771537
    createImageFromBlob(image: Blob, machine: Machine) {
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            machine.cameraSnapshot = reader.result;
        }, false);
        if (image) {
            reader.readAsDataURL(image);
        }
    }
}
