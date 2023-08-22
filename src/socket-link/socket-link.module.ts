import { Module } from '@nestjs/common';
import { SocketLinkService } from './socket-link.service';
import { GatewayModule } from 'src/gateway/gateway.module';
import { PxlabModule } from 'src/pxlab/pxlab.module';

@Module({
  imports: [GatewayModule, PxlabModule],
  providers: [SocketLinkService],
  exports: [SocketLinkService],
})
export class SocketLinkModule {}
