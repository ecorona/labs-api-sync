import { Module } from '@nestjs/common';
import { SocketLinkService } from './socket-link.service';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  providers: [SocketLinkService],
  exports: [SocketLinkService],
})
export class SocketLinkModule {}
