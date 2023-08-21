import { Injectable } from '@nestjs/common';
import * as chokidar from 'chokidar';
import { Subject } from 'rxjs';
@Injectable()
export class EstudiosPdfService {
  archivoCambiadoSubject: Subject<string>;

  watcher: chokidar.FSWatcher;
  //private readonly CARPETA_ESTUDIOS = 'C:\\Users\\jose\\Desktop\\estudios';
  private readonly CARPETA_ESTUDIOS = '/home/developer/pdf'; //FIXME: configurable

  constructor() {
    this.archivoCambiadoSubject = new Subject<string>();
    this.monitorearCarpeta(this.CARPETA_ESTUDIOS);
  }

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
      this.watcher.on('add', this.onAdd);
      this.watcher.on('change', this.onChange);
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

  onChange(path: string) {
    console.log('Archivo modificado: ' + path);
    this.archivoCambiadoSubject?.next(path);
  }

  onAdd(path: string) {
    console.log('Archivo agregado: ' + path);
    this.archivoCambiadoSubject?.next(path);
  }
}
