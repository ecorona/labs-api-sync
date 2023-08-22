import { Global, Module } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
@Global()
@Module({
  providers: [ConfiguracionService],
  exports: [ConfiguracionService],
})
export class ConfiguracionModule {}
