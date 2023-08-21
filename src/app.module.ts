import { Module, OnModuleInit } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { EstudiosPdfModule } from './estudios-pdf/estudios-pdf.module';
import { SocketLinkModule } from './socket-link/socket-link.module';
import { EstudiosPdfService } from './estudios-pdf/estudios-pdf.service';
import { SocketLinkService } from './socket-link/socket-link.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'dist/www'),
      renderPath: '/',
    }),
    HttpModule,
    EstudiosPdfModule,
    SocketLinkModule,
  ],
})
export class AppModule implements OnModuleInit {
  private readonly CARPETA_ESTUDIOS = '/home/developer/pdf'; //FIXME: configurable
  constructor(
    private readonly socketLinkService: SocketLinkService,
    private readonly estudiosPdfService: EstudiosPdfService,
  ) {}
  onModuleInit() {
    this.socketLinkService.conectado$.subscribe((conectado) => {
      console.log('Conectado!!!!!!: ' + conectado);
    });

    this.socketLinkService.setToken('d8d9941c-f4b9-47e8-b17b-4920dd68ea91');
    this.estudiosPdfService.monitorearCarpeta(this.CARPETA_ESTUDIOS);
  }
}
