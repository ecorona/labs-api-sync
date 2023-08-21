import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as chokidar from 'chokidar';
import { readFileSync, unlinkSync } from 'fs';
import { EventsGateway } from 'src/gateway/events/events.gateway';
@Injectable()
export class EstudiosPdfService {
  watcher: chokidar.FSWatcher;
  private apiServer = 'https://api-xquenda-testing.xst.mx';

  constructor(
    private readonly httpService: HttpService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Monitorea una carpeta en busca de archivos PDF nuevos o modificados
   * usar chokidar
   * @param carpeta ruta a monitorear
   */
  monitorearCarpeta(carpeta: string) {
    if (!this.watcher) {
      console.log('Monitoreando carpeta: ' + carpeta);

      // Initialize watcher.
      this.watcher = chokidar.watch(carpeta, {
        ignored: /^\./,
        persistent: true,
        depth: 1,
      });

      // Add event listeners.
      this.watcher.on('add', (path) => {
        console.log('Archivo agregado: ' + path);
        this.enviarArchivo(path);
      });
      // this.watcher.on('change', (path) => {
      //   console.log('Archivo modificado: ' + path);
      //   this.enviarArchivo(path);
      // });
    } else {
      console.log('Ya se está monitoreando una carpeta');
      console.log('Carpeta actual: ' + this.watcher.getWatched());
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
        next: () => {
          console.log('Archivo enviado:', path);
          //emitir por EventsGateway que el archivo se ha enviado
          this.eventsGateway.server
            .to('monitor-local')
            .emit('archivo-enviado', path);
          //borrar el archivo enviado.
          unlinkSync(path);
          console.log('Archivo borrado: ' + path);
          //emitir por EventsGateway que el archivo se ha borrado
          this.eventsGateway.server
            .to('monitor-local')
            .emit('archivo-borrado', path);
        },
        error: (error) => {
          if (error.response) {
            // get response with a status code not in range 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
          } else if (error.request) {
            // no response
            console.log(error.request);
          } else {
            // Something wrong in setting up the request
            console.log('Error', error.message);
          }
          console.log(error.config);
        },
      });
  }
}
