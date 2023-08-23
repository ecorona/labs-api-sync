import { Module, OnModuleInit } from '@nestjs/common';
import { EstudiosPdfModule } from './estudios-pdf/estudios-pdf.module';
import { SocketLinkModule } from './socket-link/socket-link.module';
import { SocketLinkService } from './socket-link/socket-link.service';
import { HttpModule } from '@nestjs/axios';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { GatewayModule } from './gateway/gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyslogEntity } from './syslog/syslog.entity';
import { PxlabModule } from './pxlab/pxlab.module';
import { ConfiguracionService } from './configuracion/configuracion.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ArchivoEntity } from './archivos/archivo.entity';
import { SysLogger } from './syslog/logger.service';

@Module({
  imports: [
    HttpModule,
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: 'monitor.db',
      autoSave: true,
      entities: [SyslogEntity, ArchivoEntity],
      synchronize: true,
    }),
    EstudiosPdfModule,
    SocketLinkModule,
    ConfiguracionModule,
    GatewayModule,
    PxlabModule,
  ],
  providers: [SocketLinkService],
})
export class AppModule implements OnModuleInit {
  private logger = new SysLogger(AppModule.name);
  constructor(
    private readonly socketLinkService: SocketLinkService,
    private readonly configuracionService: ConfiguracionService,
  ) {}
  onModuleInit() {
    //obtener la configuracion actual
    const config = this.configuracionService.getConfig();
    this.logger.verbose('Configuracion actual:');
    this.logger.dir(config);
    //obtener el token de la configuracion
    const token = this.configuracionService.getValue('apiKey');
    if (token) {
      this.socketLinkService.setToken(token);
    } else {
      this.logger.warn(
        '*    ¡¡¡ No se ha configurado un api key para este monitor, no se podrá conectar al servidor remoto.!!!',
      );
      this.logger.warn(
        '*    ' +
          __dirname +
          'configuracion.json                                    *',
      );
    }
  }
}
