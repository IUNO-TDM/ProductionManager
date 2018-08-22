import {AfterViewInit, Component, OnInit} from '@angular/core';
import {TitleService} from '../../services/title.service';
import {MachineService} from '../../services/machine.service';
import {Router} from '@angular/router';
import {LocalObjectService} from '../../services/local-object.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'app-own-objects',
    templateUrl: './own-objects.component.html',
    styleUrls: ['./own-objects.component.css']
})
export class OwnObjectsComponent implements OnInit, AfterViewInit {
    objects = [];
    selectedObject: any = null;
    loading = true;
    objectSubscription: Subscription;

    constructor(
        private router: Router,
        private titleService: TitleService,
        private objectService: LocalObjectService,
    ) {}

    ngOnInit() {

        this.updateObjects();
    }

    ngAfterViewInit() {
        this.titleService.setTitle('Eigene Objekte');
    }

    onAddObjectClicked() {
        this.router.navigateByUrl('own-objects/create');
    }

    onObjectSelected(object) {
        this.selectedObject = object;
    }

    deselectObject() {
        this.selectedObject = null;
    }

    updateObjects() {
        this.objectSubscription = this.objectService.getObjects().subscribe(objects => {
            this.objects = objects;
            this.loading = false;
            this.objectSubscription.unsubscribe();
        });
    }

    objectDeleted() {
        this.selectedObject = null;
        this.updateObjects();
    }
}
