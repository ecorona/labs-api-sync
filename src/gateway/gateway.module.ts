import { Global, Module } from '@nestjs/common';
import { EventsGateway } from './events/events.gateway';
import { ConfiguracionModule } from 'src/configuracion/configuracion.module';
@Global()
@Module({
  imports: [ConfiguracionModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class GatewayModule {}
