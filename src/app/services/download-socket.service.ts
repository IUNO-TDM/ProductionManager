import { Injectable, NgZone } from '@angular/core';
import { Socket } from 'ng6-socket-io';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DownloadSocket extends Socket {

    constructor(ngZone: NgZone) {
        super({
            url: window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/downloadservice',
            options: {}
        }, ngZone);
    }

}

@Injectable({
    providedIn: 'root'
})
export class DownloadSocketService {

    constructor(private socket: DownloadSocket) {
    }

    joinRoom(room: string) {
        this.socket.emit('room', room);
    }

    leaveRoom(room: string) {
        this.socket.emit('leave', room);
    }

    getUpdates(subject: string): Observable<any> {
        return this.socket.fromEvent<any>(subject);
    }
}
