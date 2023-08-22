import { io } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { ClientData } from './client-data.dto';
import { EventsGateway } from 'src/gateway/events/events.gateway';
import { DataSource } from 'typeorm';
import { SyslogEntity } from 'src/syslog/syslog.entity';
import { TareaData } from './tarea-data.dto';
import { PxlabService } from 'src/pxlab/pxlab.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SysLogger } from 'src/syslog/logger.service';
import { LastUserCheck } from './dto/last-user-check.dto';
import { ConfiguracionService } from 'src/configuracion/configuracion.service';

@Injectable()
export class SocketLinkService {
  private logger = new SysLogger(SocketLinkService.name);
  //obtener de configuracion json, este es el api de la plataforma
  //vamos a ser clientes para recibir eventos de la plataforma
  private apiServer = ''; //configurable
  private apikey = ''; //configurable

  private lastUserCheck: BehaviorSubject<LastUserCheck> =
    new BehaviorSubject<LastUserCheck>(null);

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

  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly pxlabService: PxlabService,
    private readonly configuracionService: ConfiguracionService,
  ) {
    this.apiServer = this.configuracionService.getValue('hostMonitor');
    this.apikey = this.configuracionService.getValue('apiKey');
  }

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
    //plataforma
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

      //avisar por evento desacoplado al service de estudios-pdf que debe encender el watch
      this.eventEmitter.emit('encender-monitor.archivos');
    });
    this.socket.on('disconnect', async () => {
      this.conectado = false;
      this.events.next({ event: 'disconnect' });
      await this.dataSource.getRepository(SyslogEntity).save({
        fecha: new Date(),
        message: 'Desconectado del servidor',
      });

      //avisar por evento desacoplado al service de estudios-pdf que debe apagar el watch ya que
      //no hay conexión con el servidor
      this.eventEmitter.emit('apagar-monitor.archivos');
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

    // LEV:2
    this.socket.on('nuevaVenta', async (tarea: TareaData) => {
      await this.handleNuevaVenta(tarea);
    });

    this.socket.on('horaServer', (hora) => {
      this.eventsGateway.server.to('monitor-local').emit('horaServer', hora);
    });

    this.socket.on('nuevoQr', async (qr) => {
      await this.handleNuevoQr(qr);
    });

    this.socket.on('quemandoQr', async (qr) => {
      await this.handleQuemando(qr);
    });
  }

  //desconectar los eventos
  offEvents(): void {
    this.socket.off();
  }

  //enviar una solicitud al api
  sendRequest(event: string, data: string | object = '', cb = null): void {
    this.socket.emit(
      event,
      {
        data,
      },
      (response) => {
        if (typeof cb === 'function') {
          return cb(response);
        }
      },
    );
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

  async handleNuevaVenta(tarea: TareaData) {
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

      // LEV:3.1 (demo)
      this.sendRequest('pxlab.responseVenta', respuesta);

      this.logger.verbose('Modo demo:' + responseSoapTest.MuestraResult);

      // self.ocupadoEnTarea = false;
      return respuesta;
    }

    LEV: 2.5;
    const responseSoap = await this.pxlabService.enviarServicios(tarea.data);
    this.logger.verbose('response enviarServicios', responseSoap);
    LEV: 3;
    if (
      responseSoap &&
      responseSoap.MuestraResult &&
      responseSoap.MuestraResult.split('|')[0] === '1'
    ) {
      await this.dataSource.getRepository(SyslogEntity).save({
        fecha: new Date(),
        message:
          'NuevaVenta->response: ' + responseSoap.MuestraResult.split('|')[1],
      });
      // decirle a nuestro software que ya quedó
      const idVenta = parseInt(tarea.data.split('|')[0].trim());
      const respuesta = {
        idVenta,
        response: responseSoap,
        tareaId: tarea.id,
      };
      // lanzar la respuesta por socket a el server, avisando de esta venta y
      // su nuevo foliopx, y la tarea, ya esta finalizada
      // LEV:3.1
      this.sendRequest('pxlab.responseVenta', respuesta);
      // va a dar al back->events.gateway->folioPXListo(respuesta)

      // self.ocupadoEnTarea = false;
      return respuesta;
    } else {
      const error = responseSoap.MuestraResult.split('|')[1];
      // LEV:3.5
      this.sendRequest('pxlab.tareaErronea', {
        result: responseSoap.MuestraResult || responseSoap,
        tareaId: tarea.id,
      });
      // self.log('ERROR EN PX, Verificar estudios: ', error, '', 'error');
      await this.dataSource.getRepository(SyslogEntity).save({
        fecha: new Date(),
        message: (
          'NuevaVenta->error al enviar a px: ' + JSON.stringify(error)
        ).substring(0, 255),
      });
      this.sendRequest('monitor.pxError', {
        pxError: error,
        tareaId: tarea.id,
      });
      // self.ocupadoEnTarea = false;
      return responseSoap.MuestraResult;
    }
  }

  //manejar el nuevo qr, meterlo a data, mostrar el usuario escaneado.
  handleNuevoQr(response) {
    console.log('handleNuevoQr', response);
    // const data = this.data.getValue();
    // data.qr = response.codigoNuevo.uuid;
    // this.data.next(data);

    // //montar el lastUserCheck en el subject
    // const lastUserCheck: LastUserCheck = {
    //   lastUser: response.usuarioQuema,
    //   lastUserCheck: response.resultQuemar.fechaHora,
    //   escaneando: false,
    // };

    // this.lastUserCheck.next(lastUserCheck);
  }

  handleQuemando(qr: {
    contrato: {
      empleado: {
        nombreCompleto: string;
      };
      puesto: {
        nombre: string;
        departamento: {
          nombre: string;
        };
      };
    };
  }) {
    console.log('handleQuemando', qr);
    // const data = this.data.getValue();

    // //montar el lastUserCheck en el subject
    // const lastUserCheck: LastUserCheck = {
    //   lastUser: qr.usuarioQuema,
    //   lastUserCheck: qr.resultQuemar.fechaHora,
    //   escaneando: false,
    // };
    // this.lastUserCheck.next(lastUserCheck);
  }
}
