import { Injectable } from '@nestjs/common';
import { ConfigValues } from './dto/config.values';
import { existsSync, readFileSync, writeFileSync } from 'fs';

@Injectable()
export class ConfiguracionService {
  getConfig(): ConfigValues {
    //si el archivo no existe
    if (!existsSync('configuracion.json')) {
      //crear el archivo
      writeFileSync(
        'configuracion.json',
        JSON.stringify({
          hostMonitor: 'http://localhost:3005',
          pxLabHost: 'http://localhost:8005/WSPxLab.asmx?WSDL',
          hostGateway: 'https://plataforma.laboratoriosanfrancisco.mx',
          apiKey: '',
          monitorPdfPath: 'C:\\Xystems\\ResultadosPDF\\',
        }),
      );
    }
    //leer el archivo configuracion.json
    const config = readFileSync('configuracion.json', 'utf8');
    return JSON.parse(config);
  }

  /**
   * Almacenar en configuracion.json los valores obtenidos
   *
   * @returns { any }
   */
  async setConfig(config: ConfigValues): Promise<ConfigValues> {
    //escribir en el archivo el json
    writeFileSync('configuracion.json', JSON.stringify(config));
    return config;
  }

  getValue(key: string): string {
    return this.getConfig()?.[key] || null;
  }
}
