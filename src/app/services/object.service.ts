import {Injectable, Inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {LOCALE_ID} from '@angular/core';
import {map} from 'rxjs/operators';
import {TdmObject} from '../models/object';
import {BehaviorSubject, Observable} from 'rxjs';
import {DownloadSocketService} from './download-socket.service';
import {Filter} from '../models/filter';

export class DownloadState {
    UNKNOWN_STATE = 'unknown';
    DOWNLOAD_REQUIRED_STATE = 'download_required';
    DOWNLOADING_STATE = 'downloading';
    READY_STATE = 'ready';

    state: string = this.UNKNOWN_STATE;
    bytesTotal = -1;
    bytesDownloaded = -1;

    /**
     * Constructor of DownloadState
     * @param downloadState dictionary with state and downloading stats. Can be null.
     */
    constructor(downloadState) {
        if (downloadState) {
            this.state = downloadState.state;
            this.bytesTotal = downloadState.bytesTotal;
            this.bytesDownloaded = downloadState.bytesDownloaded;
        }
    }

    isUnknownState() {
        return this.state === this.UNKNOWN_STATE;
    }

    isDownloadRequiredState() {
        return this.state === this.DOWNLOAD_REQUIRED_STATE;
    }

    isDownloadingState() {
        return this.state === this.DOWNLOADING_STATE;
    }

    isReadyState() {
        return this.state === this.READY_STATE;
    }
}

@Injectable({
    providedIn: 'root'
})

export class ObjectService {
    private apiUrl = '/api/';
    private downloadStates = {};
    private locale = 'en';

    constructor(
        @Inject(LOCALE_ID) locale: string,
        private http: HttpClient,
        private downloadSocketService: DownloadSocketService
    ) {
        this.locale = locale;
        console.log('Locale: ' + locale);
        this.downloadSocketService.getUpdates('state_change').subscribe(state => {
            const downloadState = this.downloadStates[state.id];
            if (downloadState) {
                downloadState.next(new DownloadState(state));
            }
        });
    }

    /**
     * Returns all objects of the marketplace matching at least one of the machineTypes or materials.
     * If machineTypes and materials are empty, all objects are returned.
     * @param machineTypes array of machinetypes. Objects matching at least one of the machine types are returned.
     * @param materials array of materials. Objects matching at least one of the materials are returned.
     * @param purchased boolean value. If true, only objects that were purchased at some times are returned.
     * @returns marketplace objects
     */
    getObjects(filterId: string) {
        const url = this.apiUrl + 'objects';
        const params = {};

        params['filter'] = filterId;

        return this.http.get<TdmObject[]>(url, {
            params: params
        });
    }

    /**
     * Queries the marketplace for the object with provied id.
     * @param id id of the object to return
     * @returns the object details for the corresponding id.
     */
    getObject(id: string) {
        const url = this.apiUrl + 'objects/' + id;
        const params = {};

        // add language to query parameters
        // FIXME: set correct language. But be careful, LOCALE_ID is now like 'en-US' instead of 'en'
        params['lang'] = 'de';

        return this.http.get<TdmObject[]>(url, {
            params: params
        })
    }

    /**
     * Tells the backend to start downloading the binary file for the provided object id.
     * @param id object id of the object for which the binary should be downloaded
     * @returns an observable containing the request.
     */
    startDownloadingBinary(id: string) {
        const url = this.apiUrl + 'objects/' + id + '/binary';
        return this.http.get(url);
    }

    /**
     * Returns a BehaviorSubject for the download state of the provided object id.
     * The value of the subject is updated when the download state changes (e.g. while downloading).
     * @param id object id
     * @returns a BehaviorSubject for the download state of the provided object id. The initial value of the subject is null.
     */
    getDownloadState(id: string): BehaviorSubject<DownloadState> {
        let downloadState: BehaviorSubject<DownloadState> = this.downloadStates[id];
        if (!downloadState) {
            // No download state exists. Create a new BehaviorSubject and join
            // the socket.id room for state change events of the provided object id.
            downloadState = new BehaviorSubject<DownloadState>(null);
            this.downloadStates[id] = downloadState;
            this.downloadSocketService.joinRoom(id);
        }
        return downloadState;
    }

    printObject(objectId: string, machineId: string) {

        const url = this.apiUrl + 'objects/' + objectId + '/print';
        const body = {
            'machineId': machineId
        };
        return this.http.post(url, body);
    }

    createFilter(filter: Filter): Observable<string> {
        const url = this.apiUrl + 'objects/filters';
        return this.http.post(url, filter, {responseType: 'text', observe: 'response'}).pipe(map(response => {
            const location = response.headers.get('location');
            return location.substr(location.lastIndexOf('/') + 1);
        }));
    }
}
