import { Module } from '@nestjs/common';
import { SocketLinkService } from './socket-link.service';

@Module({
  providers: [SocketLinkService],
  exports: [SocketLinkService],
})
export class SocketLinkModule {}
