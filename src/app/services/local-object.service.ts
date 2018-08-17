import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {LocalObject} from '../models/localObject';
import {Observable} from 'rxjs';
import {BehaviorSubject} from 'rxjs';
import {PublishSocketService} from './publish-socket.service';

export class UploadState {
    UNKNOWN_STATE = 'unknown';
    UPLOADING_STATE = 'uploading';
    READY_STATE = 'ready';

    state: string = this.UNKNOWN_STATE;
    bytesTotal: number = -1;
    bytesUploaded: number = -1;

    /**
     * Constructor of UploadState
     * @param uploadState dictionary with state and uploading stats. Can be null.
     */
    constructor(uploadState) {
        if (uploadState) {
            this.state = uploadState.state;
            this.bytesTotal = uploadState.bytesTotal;
            this.bytesUploaded = uploadState.bytesUploaded;
        }
    }

    isUnknownState() {
        return this.state === this.UNKNOWN_STATE;
    }

    isUploadingState() {
        return this.state === this.UPLOADING_STATE;
    }

    isReadyState() {
        return this.state === this.READY_STATE;
    }
}

export enum PublishState {
    UNINITIALIZED = 'uninitialized',
    INITIAL = 'initial',
    NOT_PUBLISHED = 'notPublished',
    ENCRYPTING = 'encrypting',
    ENCRYPTION_ERROR = 'encryptionError',
    ENCRYPTED = 'encrypted',
    CREATING_TDM_OBJECT = 'creatingTdmObject',
    TDM_OBJECT_CREATE_ERROR = 'tdmObjectCreateError',
    TDM_OBJECT_CREATED = 'tdmObjectCreated',
    UPLOADING = 'uploading',
    UPLOAD_ERROR = 'uploadError',
    UPLOADED = 'uploaded'
}


@Injectable({
    providedIn: 'root'
})
export class LocalObjectService {
    private apiUrl = '/api/localobjects';
    private uploadStates = {};
    private publishStates = {};

    constructor(
        private http: HttpClient,
        private uploadSocketService: PublishSocketService
    ) {
        this.uploadSocketService.getUpdates('uploadState').subscribe(state => {
            const uploadState = this.uploadStates[state['localObjectId']];
            if (uploadState) {
                uploadState.next(new UploadState(state));
            }
        });
        this.uploadSocketService.getUpdates('state').subscribe(state => {
            const publishState = this.publishStates[state['localObjectId']];
            if (publishState) {
                publishState.next(<PublishState>(state.toState));
            }
        });
    }

    getObjects(): Observable<Array<LocalObject>> {
        const url = this.apiUrl;

        return this.http.get<Array<LocalObject>>(url);
    }

    deleteObject(objectId: string) {
        const url = this.apiUrl + '/' + objectId;

        return this.http.delete(url, {responseType: 'text'});
    }

    publishObject(objectId: string, data: {}) {
        const url = this.apiUrl + '/' + objectId + '/publish';
        const body = data;
        return this.http.post(url, body, {responseType: 'text'});
    }


    /**
     * Returns a BehaviorSubject for the download state of the provided object id.
     * The value of the subject is updated when the download state changes (e.g. while downloading).
     * @param id object id
     * @returns a BehaviorSubject for the download state of the provided object id. The initial value of the subject is null.
     */
    getUploadState(id: string): BehaviorSubject<UploadState> {
        let uploadState: BehaviorSubject<UploadState> = this.uploadStates[id];
        if (!uploadState) {
            // No upload state exists. Create a new BehaviorSubject and join
            // the socket.id room for state change events of the provided object id.
            uploadState = new BehaviorSubject<UploadState>(null);
            this.uploadStates[id] = uploadState;
            this.uploadSocketService.joinRoom(id);
        }
        return uploadState;
    }

    getPublishState(id: string): BehaviorSubject<PublishState> {
        let publishState: BehaviorSubject<PublishState> = this.publishStates[id];
        if (!publishState) {
            // No upload state exists. Create a new BehaviorSubject and join
            // the socket.id room for state change events of the provided object id.
            publishState = new BehaviorSubject<PublishState>(null);
            this.publishStates[id] = publishState;
            this.uploadSocketService.joinRoom(id);
        }
        return publishState;
    }


    printObject(objectId: string, machineId: string) {

        const url = this.apiUrl + '/' + objectId + '/print';
        const body = {
            'machineId': machineId
        };
        return this.http.post(url, body);
    }

    updateObject(objectId: string, title: string, description: string): Observable<LocalObject> {
        const url = this.apiUrl + '/' + objectId;
        const body = {};
        if (title) {
            body['name'] = title;
        }
        if (description) {
            body['description'] = description;
        }

        return this.http.patch(url, body);
    }

}
