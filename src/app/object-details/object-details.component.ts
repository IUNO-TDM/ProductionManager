import { Component, OnInit, Input, NgZone } from '@angular/core';
import { ObjectService, DownloadState } from '../services/object.service';

@Component({
    selector: 'app-object-details-actions',
    template: '<ng-content></ng-content>'
})
export class ObjectDetailsActionsComponent {
    constructor() {
    }
}

@Component({
    selector: 'app-object-details',
    templateUrl: './object-details.component.html',
    styleUrls: ['./object-details.component.css']
})
export class ObjectDetailsComponent implements OnInit {
    // @Input() object: any;
    @Input() objectId: string
    private object: any
    private loading = true
    progress = 0;
    downloadState = new DownloadState(null)

    constructor(
        private zone: NgZone,
        private objectService: ObjectService
    ) {
    }

    ngOnInit() {
        this.objectService.getObject(this.objectId).subscribe(object => {
            this.object = object
            this.objectService.getDownloadState(this.object.id).subscribe(downloadState => {
                this.zone.run(() => {
                    this.downloadState = downloadState;
                    this.progress = 1;
                    if (this.downloadState) {
                        if (downloadState.bytesTotal > 0) {
                            this.progress = 100 * +downloadState.bytesDownloaded / +downloadState.bytesTotal;
                        }
                    }
                    this.loading = false
                });
            });
        })
    }

    ngOnDestroy() {
    }

}
