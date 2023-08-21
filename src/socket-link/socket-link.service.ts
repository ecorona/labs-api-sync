import { io } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketLinkService {
  private apiServer = 'https://api-xquenda-testing.xst.mx';
  // eventos personalizados
  public events = new Subject<{ event: string; data?: any }>();
  private _conectado: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false,
  );
  private _conectando: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    true,
  );

  get conectado$(): Observable<boolean> {
    return this._conectado.asObservable();
  }

  get conectando$(): Observable<boolean> {
    return this._conectando.asObservable();
  }

  get events$(): Observable<{ event: string; data?: any }> {
    return this.events.asObservable();
  }
  set conectando(val: boolean) {
    this._conectando.next(val);
  }

  set conectado(val: boolean) {
    this._conectado.next(val);
  }

  private socket = io(this.apiServer, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    withCredentials: true,
    auth: {
      token: '',
      mode: 'monitor',
      scope: 'nuevo-monitor',
    },
  });

  private token = '';

  constructor() {
    console.log('wsService > loaded');
  }

  setToken(token: string): void {
    this.token = token;
    this.socket.auth['token'] = token;
    if (this.token) {
      this.connect();
    }
  }

  setEvents(): void {
    this.socket.on('connect', () => {
      this.conectado = true;
      this.conectando = false;
      this.joinChannels();
      this.events.next({ event: 'connect' });
    });
    this.socket.on('disconnect', () => {
      this.conectado = false;
      this._conectado.next(false);
      this.events.next({ event: 'disconnect' });
    });
    this.socket.on('reconnecting', () => {
      this._conectando.next(true);
      this.conectando = true;
    });
    this.socket.on('connect_error', (err) => {
      console.log('wsService > connect_error:', err);
    });
    this.socket.on('exception', (err) => {
      console.log('wsService > exception:', err);
    });

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //                            Eventos de la aplicación
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    this.socket.on('nuevaVenta', (tarea) => {
      console.log('wsService > nuevaVenta > tarea:', tarea);
      this.events.next({ event: 'nuevaVenta', data: tarea });
    });
  }

  offEvents(): void {
    this.socket.off();
  }

  sendRequest(event: string, data: string | object = '', cb = null): void {
    this.socket.emit(event, data, (response) => {
      if (typeof cb === 'function') {
        return cb(response);
      }
    });
  }

  joinChannels(): boolean {
    if (this.token) {
      this.sendRequest('monitor.online', null, (response) => {
        console.log('wsService > joinChannels > response:', response);
      });
    }
    return false;
  }

  connect(): void {
    if (!this.conectado && !this.conectando) {
      console.log('wsService > connecting > ', this.apiServer);
      this.conectando = true;
      this._conectando.next(true);
      this.setEvents();
      this.socket.connect();
    }
  }

  disconnect(): void {
    console.log('wsService > disconnect > ', this.apiServer);
    this.socket.disconnect();
    this.offEvents();
  }
}
