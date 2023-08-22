import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import * as chokidar from 'chokidar';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { EventsGateway } from 'src/gateway/events/events.gateway';
import { SyslogEntity } from 'src/syslog/syslog.entity';
import { DataSource } from 'typeorm';
@Injectable()
export class EstudiosPdfService {
  logger: Logger = new Logger(EstudiosPdfService.name);
  watcher: chokidar.FSWatcher;
  private apiServer = 'https://api-xquenda-testing.xst.mx';

  constructor(
    private readonly httpService: HttpService,
    private readonly eventsGateway: EventsGateway,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Monitorea una carpeta en busca de archivos PDF nuevos o modificados
   * usar chokidar
   * @param carpeta ruta a monitorear
   */
  monitorearCarpeta(carpeta: string) {
    if (!this.watcher) {
      this.logger.verbose('Monitoreando carpeta: ' + carpeta);

      // Initialize watcher.
      this.watcher = chokidar.watch(carpeta, {
        ignored: /^\./,
        persistent: true,
        depth: 1,
      });

      // Add event listeners.
      this.watcher.on('add', async (path) => {
        this.logger.verbose('Archivo detectado: ' + path);
        //agregar a syslog
        await this.dataSource.getRepository(SyslogEntity).save({
          fecha: new Date(),
          message: 'Archivo detectado: ' + path,
        });
        this.enviarArchivo(path);
      });
      // this.watcher.on('change', (path) => {
      //   this.logger.verbose('Archivo modificado: ' + path);
      //   this.enviarArchivo(path);
      // });
    } else {
      this.logger.verbose('Ya se está monitoreando una carpeta');
      this.logger.verbose('Carpeta actual: ' + this.watcher.getWatched());
    }
  }

  cancelarMonitor() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  enviarArchivo(path: string) {
    //si ya tenemos token, el socket está conectado
    const formData = new FormData();
    //enviar archivo al server, como un post

    //leer el contenido del archivo como blob
    const blob = new Blob([readFileSync(path)], {
      type: 'application/pdf',
    });

    formData.append('archivo', blob, path);

    this.httpService
      .post(this.apiServer + '/api/v1/pxlab/pdf', formData, {
        headers: {
          'api-key': 'd8d9941c-f4b9-47e8-b17b-4920dd68ea91',
        },
      })
      .subscribe({
        next: async () => {
          this.logger.verbose('Archivo enviado:', path);
          //emitir por EventsGateway que el archivo se ha enviado
          this.eventsGateway.server
            .to('monitor-local')
            .emit('archivo-enviado', path);
          //borrar el archivo enviado.
          unlinkSync(path);
          this.logger.verbose('Archivo borrado: ' + path);
          //emitir por EventsGateway que el archivo se ha borrado
          this.eventsGateway.server
            .to('monitor-local')
            .emit('archivo-borrado', path);

          //agregar a syslog
          await this.dataSource.getRepository(SyslogEntity).save({
            fecha: new Date(),
            message: 'Archivo enviado: ' + path,
          });
        },
        error: async (error) => {
          //agregar a syslog
          await this.dataSource.getRepository(SyslogEntity).save({
            fecha: new Date(),
            message: 'Error enviando archivo : ' + path,
          });
          //guardar este error en un json con el mismo nombre que el archivo
          const nombreArchivo = path.split('/').pop();
          const sinExtension = nombreArchivo.split('.').shift();
          const nuevoArchivo = sinExtension + '.json';
          const contenido = JSON.stringify(error);
          //grabar el archivo
          writeFileSync(nuevoArchivo, contenido);

          if (error.response) {
            // get response with a status code not in range 2xx
            this.logger.verbose(error.response.data);
            this.logger.verbose(error.response.status);
            this.logger.verbose(error.response.headers);
          } else if (error.request) {
            // no response
            this.logger.verbose(error.request);
          } else {
            // Something wrong in setting up the request
            this.logger.verbose('Error', error.message);
          }
          this.logger.verbose(error.config);
        },
      });
  }
}
