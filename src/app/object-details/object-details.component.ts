import { Component, OnInit, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { ObjectService, DownloadState } from '../services/object.service';

@Component({
  selector: 'app-object-details-actions',
  template: '<ng-content></ng-content>'
})
export class ObjectDetailsActionsComponent {
  constructor() { }
}

@Component({
  selector: 'app-object-details',
  templateUrl: './object-details.component.html',
  styleUrls: ['./object-details.component.css']
})
export class ObjectDetailsComponent implements OnInit {
  @Input() object: any;
  progress = 0;
  downloadState = new DownloadState(null);

  constructor(
    private zone: NgZone,
    private objectService: ObjectService
  ) {
  }

  ngOnInit() {
    this.objectService.getDownloadState(this.object.id).subscribe(downloadState => {
      this.zone.run(() => {
        this.downloadState = downloadState;
        if (downloadState.bytesTotal > 0) {
          this.progress = 100 * +downloadState.bytesDownloaded / +downloadState.bytesTotal
        } else {
          this.progress = 1
        }
      });
    })
  }

  ngOnDestroy() {
  }

}
