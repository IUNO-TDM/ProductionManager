import {Component, OnInit, Input} from '@angular/core';
import {Machine} from '../../../models/machine';
import {MachineService} from '../../../services/machine.service';
import {Material} from '../../../models/material';
import {MaterialService} from '../../../services/material.service';
import {MaterialDefinition} from '../../../models/materialDefinition';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

enum AuthenticationStatusEnum {
    No_Information = 0,
    Not_Requested = 1,
    Unknown = 2,
    Unauthorized = 3,
    Authorized = 4
}


@Component({
    selector: 'app-machine',
    templateUrl: './machine.component.html',
    styleUrls: ['./machine.component.css']
})

export class MachineComponent implements OnInit {
    @Input() machine: Machine;

    AuthEnum = AuthenticationStatusEnum;

    authenticationStatus = this.AuthEnum.Unknown;
    authenticationRequested = false;
    materials = Array<Material>();
    materialDefinitions = Array<MaterialDefinition>();
    cameraSrc: SafeResourceUrl;

    constructor(private machineService: MachineService, private materialService: MaterialService, private sanitizer: DomSanitizer) {
    }

    ngOnInit() {
        this.checkAuthenticated();
        this.updateMaterials();
        this.materialService.getAllMaterials().subscribe((materials) => {
            this.materialDefinitions = materials;
        });
        this.cameraSrc = this.sanitizer.bypassSecurityTrustResourceUrl( 'api/machines/' + this.machine.id + '/camera/stream');

    }

    checkAuthenticated() {
        this.machineService.getAuthenticated(this.machine.id).subscribe(value => {
                switch (value['message']) {
                    case 'unauthorized':
                        this.authenticationStatus = this.AuthEnum.Unauthorized;
                        break;
                    case 'authorized':
                        this.authenticationStatus = this.AuthEnum.Authorized;
                        break;
                    case 'not requested':
                        this.authenticationStatus = this.AuthEnum.Not_Requested;
                        break;
                    case 'unknown':
                        this.authenticationStatus = this.AuthEnum.Unknown;
                        break;
                    default:
                        this.authenticationStatus = this.AuthEnum.No_Information;
                        break;
                }
                if (this.authenticationStatus === this.AuthEnum.Unknown) {
                    setTimeout(() => this.checkAuthenticated(), 5000);
                } else {
                    this.authenticationRequested = false;
                }
            }
        );
    }

    requestAuthentication() {
        this.machineService.requestAuthentication(this.machine.id).subscribe();
        this.authenticationRequested = true;
        this.checkAuthenticated();
    }

    updateMaterials() {
        this.machineService.getMaterials(this.machine.id).subscribe((materials) => {
            this.materials = materials;
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

    materialColorForGuid(guid: string) {
        if (!guid) {
            return '#ffffff';
        }
        for (const material of this.materialDefinitions) {
            if (material.id === guid) {
                return material.displayColor;
            }
        }
        return '#ffffff';
    }



}
