import { Injectable, NgZone } from '@angular/core';
import { Socket } from 'ng6-socket-io';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OrdersSocket extends Socket {

    constructor(ngZone: NgZone) {
        super({
            url: window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/orders',
            options: {}
        }, ngZone);
    }

}

@Injectable({
    providedIn: 'root'
})
export class OrdersSocketService {

    constructor(private socket: OrdersSocket) {
    }

    joinRoom(room: string) {
        this.socket.emit('room', room);
    }

    getUpdates(subject: string): Observable<any> {
        return this.socket.fromEvent<any>(subject);
    }
}
