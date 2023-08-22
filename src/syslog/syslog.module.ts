import { Module } from '@nestjs/common';
import { SysLogger } from './logger.service';

@Module({
  providers: [SysLogger],
  exports: [SysLogger],
})
export class SyslogModule {}
