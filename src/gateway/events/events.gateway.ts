import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfiguracionService } from 'src/configuracion/configuracion.service';
import { ConfigValues } from 'src/configuracion/dto/config.values';
import { ClientData } from 'src/socket-link/client-data.dto';
import { SysLogger } from 'src/syslog/logger.service';

@WebSocketGateway({
  transports: ['polling', 'websocket'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  clientData: ClientData = null;
  constructor(private readonly configuracionService: ConfiguracionService) {}
  private logger = new SysLogger(EventsGateway.name);

  @WebSocketServer() public server: Server;

  /**
   * Después de la inicialización del gateway
   */
  async afterInit(): Promise<any> {
    this.logger.verbose('EventsGateway initialized.');
  }

  /**
   * Cada que un cliente intenta conectarse...
   * el socket llega a la puerta, aun no esta autenticado.
   * @param { Socket } socket
   */
  async handleConnection(socket: Socket): Promise<any> {
    //suscribirlo al canal monitor-local
    socket.join('monitor-local');
    this.logger.verbose(`Client connected: ${socket.id}`);
    //mandarle la informacion de conexion actual
    socket.emit('monitor.online', this.clientData);
  }

  /**
   * Cada que un cliente se desconecta...
   * @param { Socket } client
   */
  async handleDisconnect(socket: Socket): Promise<any> {
    this.logger.verbose(`Client disconnected: ${socket.id}`);
  }

  @SubscribeMessage('get-config')
  getConfig(): Promise<ConfigValues> {
    return this.configuracionService.getConfig();
  }

  @SubscribeMessage('set-config')
  setConfig(client: Socket, payload: any): Promise<ConfigValues> {
    console.log('payload', payload);
    return this.configuracionService.getConfig();
  }

  @OnEvent('syslog')
  syslog(payload: any) {
    this.logger.log('syslog', payload);
    this.server.to('monitor-local').emit('syslog', payload);
  }
}
