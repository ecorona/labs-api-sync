import { Module, OnModuleInit } from '@nestjs/common';
import { EstudiosPdfModule } from './estudios-pdf/estudios-pdf.module';
import { SocketLinkModule } from './socket-link/socket-link.module';
import { SocketLinkService } from './socket-link/socket-link.service';
import { HttpModule } from '@nestjs/axios';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { GatewayModule } from './gateway/gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyslogEntity } from './syslog/syslog.entity';
import { DataSource } from 'typeorm';
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
      type: 'sqlite',
      database: 'monitor.sqlite',
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
    private readonly dataSource: DataSource,
    private readonly configuracionService: ConfiguracionService,
  ) {}
  onModuleInit() {
    this.socketLinkService.setToken('d8d9941c-f4b9-47e8-b17b-4920dd68ea91');

    //obtener la configuracion actual
    this.configuracionService.getConfig().then((config) => {
      this.logger.verbose('Configuración actual', config);
    });

    //guardar en el log que ya se inició.
    this.dataSource
      .getRepository(SyslogEntity)
      .save({
        fecha: new Date(),
        message: 'Servicio iniciado',
      })
      .then(() => {
        this.logger.verbose('Servicio iniciado');
      })
      .catch((err) => {
        this.logger.error('Error al guardar syslog', err);
      });
  }
}
