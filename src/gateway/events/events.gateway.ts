import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io-client';
import { ConfiguracionService } from 'src/configuracion/configuracion.service';
import { ConfigValues } from 'src/configuracion/dto/config.values';

@WebSocketGateway({
  transports: ['polling', 'websocket'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly configuracionService: ConfiguracionService) {}
  private logger: Logger = new Logger(EventsGateway.name);
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
    this.logger.verbose(`Client connected: ${socket.id}`);
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
}
