import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { EstudiosPdfModule } from './estudios-pdf/estudios-pdf.module';
import { SocketLinkModule } from './socket-link/socket-link.module';
import { EstudiosPdfService } from './estudios-pdf/estudios-pdf.service';
import { SocketLinkService } from './socket-link/socket-link.service';
import { HttpModule } from '@nestjs/axios';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { GatewayModule } from './gateway/gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyslogEntity } from './syslog/syslog.entity';
import { DataSource } from 'typeorm';
import { PxlabModule } from './pxlab/pxlab.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'monitor.sqlite',
      entities: [SyslogEntity],
      synchronize: true,
    }),
    HttpModule,
    EstudiosPdfModule,
    SocketLinkModule,
    ConfiguracionModule,
    GatewayModule,
    PxlabModule,
  ],
  providers: [SocketLinkService],
})
export class AppModule implements OnModuleInit {
  private logger: Logger = new Logger(AppModule.name);
  private readonly CARPETA_ESTUDIOS = '/home/developer/pdf'; //FIXME: configurable
  constructor(
    private readonly socketLinkService: SocketLinkService,
    private readonly estudiosPdfService: EstudiosPdfService,
    private readonly dataSource: DataSource,
  ) {}
  onModuleInit() {
    this.socketLinkService.setToken('d8d9941c-f4b9-47e8-b17b-4920dd68ea91');
    this.estudiosPdfService.monitorearCarpeta(this.CARPETA_ESTUDIOS);

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
