import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as chokidar from 'chokidar';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { EventsGateway } from 'src/gateway/events/events.gateway';
import { SyslogEntity } from 'src/syslog/syslog.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { createHash } from 'crypto';
import { ArchivoEntity } from 'src/archivos/archivo.entity';
import { SysLogger } from 'src/syslog/logger.service';
@Injectable()
export class EstudiosPdfService {
  logger = new SysLogger(EstudiosPdfService.name);
  watcher: chokidar.FSWatcher;
  private apiServer = 'http://192.168.0.18:3000'; //FIXME: configurable
  private readonly CARPETA_ESTUDIOS = '/home/developer/pdf'; //FIXME: configurable

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
  @OnEvent('encender-monitor.archivos')
  monitorearCarpeta() {
    const carpeta = this.CARPETA_ESTUDIOS;
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
        await this.enviarArchivo(path);
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

  //cancelar el monitoreo de la carpeta
  @OnEvent('apagar-monitor.archivos')
  cancelarMonitor() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  async enviarArchivo(path: string) {
    //si ya tenemos token, el socket está conectado
    const formData = new FormData();
    //enviar archivo al server, como un post

    const content = readFileSync(path);
    const hash = this.obtenerHash(content);
    if (await this.previamenteProcesado(hash, path.split('/').pop())) {
      this.logger.verbose('Archivo previamente procesado: ' + path);
      //borrar el archivo previamente procesado.
      this.deleteFile(path);
      return;
    }
    //leer el contenido del archivo como blob
    const blob = new Blob([content], {
      type: 'application/pdf',
    });

    formData.append('archivo', blob, path);

    this.httpService
      .post(this.apiServer + '/api/v1/pxlab/pdf', formData, {
        headers: {
          'api-key': 'd8d9941c-f4b9-47e8-b17b-4920dd68ea91', //FIXME: configurable
        },
      })
      .subscribe({
        next: async () => {
          this.logger.verbose('Archivo enviado: ' + path);
          //marcar este archivo como procesado
          this.agregarHash(hash, path.split('/').pop());
          //emitir por EventsGateway que el archivo se ha enviado
          this.eventsGateway.server
            .to('monitor-local')
            .emit('archivo-enviado', path);

          //borrar el archivo enviado.
          this.deleteFile(path);

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
          try {
            //guardar este error en un json con el mismo nombre que el archivo
            const nombreArchivo = path.split('/').pop();
            const sinExtension = nombreArchivo.split('.').shift();
            const nuevoArchivo = sinExtension + '.json';
            const contenido = JSON.stringify(error);
            //grabar el archivo
            writeFileSync(nuevoArchivo, contenido);
          } catch (error) {
            this.logger.warn('Error grabando archivo de log: ', error);
          }

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

  //obtener el hash de un archivo pdf para saber si ya lo procesamos previamente
  obtenerHash(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  }

  //buscar en ArchivoEntity si ya existe el hash y nombre
  async previamenteProcesado(
    hash: string,
    nombre: string,
  ): Promise<ArchivoEntity> {
    return this.dataSource
      .getRepository(ArchivoEntity)
      .findOne({ where: { hash, nombre } });
  }

  async agregarHash(hash: string, filename: string): Promise<ArchivoEntity> {
    return this.dataSource.getRepository(ArchivoEntity).save({
      hash,
      nombre: filename,
    });
  }

  deleteFile(path: string) {
    try {
      //borrar el archivo enviado.
      unlinkSync(path);
      this.logger.verbose('Archivo borrado: ' + path);
      //emitir por EventsGateway que el archivo se ha borrado
      this.eventsGateway.server
        .to('monitor-local')
        .emit('archivo-borrado', path);
    } catch (error) {
      this.logger.warn('No se pudo borrar un pdf procesado: ' + path);
    }
  }
}
