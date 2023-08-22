import { io } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Injectable, Logger } from '@nestjs/common';
import { ClientData } from './client-data.dto';
import { EventsGateway } from 'src/gateway/events/events.gateway';
import { DataSource } from 'typeorm';
import { SyslogEntity } from 'src/syslog/syslog.entity';
import { TareaData } from './tarea-data.dto';
import { PxlabService } from 'src/pxlab/pxlab.service';

@Injectable()
export class SocketLinkService {
  private logger: Logger = new Logger(SocketLinkService.name);
  //FIXME: obtener de configuracion json, este es el api de la plataforma
  //vamos a ser clientes para recibir eventos de la plataforma
  private apiServer = 'http://192.168.0.18:3000';

  isProd = false;
  private data = new BehaviorSubject<ClientData>(null);

  // eventos personalizados
  public events = new Subject<{ event: string; data?: any }>();
  private _conectado: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false,
  );
  private _conectando: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    true,
  );

  get data$(): Observable<ClientData> {
    return this.data.asObservable();
  }

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

  //socket del cliente
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

  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly dataSource: DataSource,
    private readonly pxlabService: PxlabService,
  ) {}

  //establecer el token de autorización para conectarse al socket del api server
  //y conectarse al socket
  setToken(token: string): void {
    if (token) {
      this.socket.auth['token'] = token;
      this.connect();
    }
  }

  //conectar los eventos del socket
  prepareEvents(): void {
    this.socket.on('connect', async () => {
      this.conectado = true;
      this.conectando = false;
      this.joinChannels();
      this.events.next({ event: 'connect' });
      await this.dataSource.getRepository(SyslogEntity).save({
        fecha: new Date(),
        message: 'Conectado al servidor',
      });
    });
    this.socket.on('disconnect', async () => {
      this.conectado = false;
      this.events.next({ event: 'disconnect' });
      await this.dataSource.getRepository(SyslogEntity).save({
        fecha: new Date(),
        message: 'Desconectado del servidor',
      });
    });
    this.socket.on('reconnecting', () => {
      this.conectando = true;
    });
    this.socket.on('connect_error', (err) => {
      this.logger.verbose('SocketLinkService->connect_error:', err);
    });
    this.socket.on('exception', (err) => {
      this.logger.verbose('SocketLinkService->exception:', err);
    });

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //                            Eventos de la aplicación
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    this.socket.on('nuevaVenta', async (tarea: TareaData) => {
      this.logger.verbose(
        'SocketLinkService->nuevaVenta > tarea:',
        tarea.data.substring(0, 85) + '...',
      );

      this.events.next({ event: 'nuevaVenta', data: tarea });
      await this.dataSource.getRepository(SyslogEntity).save({
        fecha: new Date(),
        message: 'Recibida nueva venta del servidor: ' + tarea.data,
      });

      if (!this.isProd) {
        const folioPx = (Math.random() * 10000000000).toFixed(0).substr(0, 8);
        const responseSoapTest = {
          MuestraResult: '1|' + folioPx,
        };
        const idVenta = parseInt(tarea.data.split('|')[0].trim());
        const respuesta = {
          idVenta,
          response: responseSoapTest,
          tareaId: tarea.id,
          dev: true,
        };

        this.logger.verbose('Modo demo:' + responseSoapTest.MuestraResult);

        // self.ocupadoEnTarea = false;
        return respuesta;
      }

      // const responseSoap = await this.pxlabService.enviarServicios(tarea.data);
      // this.logger.verbose('response enviarServicios', responseSoap);
      // if (
      //   responseSoap &&
      //   responseSoap.MuestraResult &&
      //   responseSoap.MuestraResult.split('|')[0] === '1'
      // ) {
      //   await this.dataSource.getRepository(SyslogEntity).save({
      //     fecha: new Date(),
      //     message:
      //       'NuevaVenta->response: ' + responseSoap.MuestraResult.split('|')[1],
      //   });
      //   // decirle a nuestro software que ya quedó
      //   const idVenta = parseInt(tarea.data.split('|')[0].trim());
      //   const respuesta = {
      //     idVenta,
      //     response: responseSoap,
      //     tareaId: tarea.id,
      //   };
      //   // lanzar la respuesta por socket a el server, avisando de esta venta y
      //   // su nuevo foliopx, y la tarea, ya esta finalizada
      //   // LEV:3.1
      //   this.sendRequest('pxlab.responseVenta', respuesta);
      //   // va a dar al back->events.gateway->folioPXListo(respuesta)

      //   // self.ocupadoEnTarea = false;
      //   return respuesta;
      // } else {
      //   const error = responseSoap.MuestraResult.split('|')[1];
      //   // LEV:3.5
      //   this.sendRequest('pxlab.tareaErronea', {
      //     result: responseSoap.MuestraResult || responseSoap,
      //     tareaId: tarea.id,
      //   });
      //   // self.log('ERROR EN PX, Verificar estudios: ', error, '', 'error');
      //   await this.dataSource.getRepository(SyslogEntity).save({
      //     fecha: new Date(),
      //     message: (
      //       'NuevaVenta->error al enviar a px: ' + JSON.stringify(error)
      //     ).substring(0, 255),
      //   });
      //   this.sendRequest('monitor.pxError', {
      //     pxError: error,
      //     tareaId: tarea.id,
      //   });
      //   // self.ocupadoEnTarea = false;
      // return responseSoap.MuestraResult;
      // }
    });

    this.socket.on('horaServer', (hora) => {
      //emitir por el gateway local
      this.eventsGateway.server.to('monitor-local').emit('horaServer', hora);
    });
  }

  //desconectar los eventos
  offEvents(): void {
    this.socket.off();
  }

  //enviar una solicitud al api
  sendRequest(event: string, data: string | object = '', cb = null): void {
    this.socket.emit(event, data, (response) => {
      if (typeof cb === 'function') {
        return cb(response);
      }
    });
  }

  //solicitarle al api, que me de los canales a los que me puedo unir
  joinChannels(): boolean {
    this.sendRequest('monitor.online', null, (response) => {
      this.logger.verbose(
        'SocketLinkService->joinChannels > ' + response?.channels?.length,
      );
      const currentData: ClientData = { ...response };
      this.data.next(currentData);
      //almacenar en el gateway quien soy
      this.eventsGateway.clientData = currentData;
      //emitir por el gateway quien soy
      this.eventsGateway.server
        .to('monitor-local')
        .emit('monitor.online', currentData);
    });
    return false;
  }

  //conectar al socket
  connect(): void {
    if (!this.conectado && !this.conectando) {
      this.logger.verbose('SocketLinkService->connecting > ', this.apiServer);
      this.conectando = true;
      this.prepareEvents();
      this.socket.connect();
    }
  }

  //desconectar del socket
  disconnect(): void {
    this.logger.verbose('SocketLinkService->disconnect > ', this.apiServer);
    this.socket.disconnect();
    this.offEvents();
  }
}
