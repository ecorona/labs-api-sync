import { Injectable } from '@nestjs/common';
import { ConfigValues } from './dto/config.values';
import { existsSync, readFileSync, writeFileSync } from 'fs';

@Injectable()
export class ConfiguracionService {
  async getConfig(): Promise<ConfigValues> {
    //si el archivo no existe
    if (!existsSync('configuracion.json')) {
      //crear el archivo
      writeFileSync(
        'configuracion.json',
        JSON.stringify({
          hostMonitor: 'http://localhost:3005',
          pxLabHost: 'http://localhost:3000',
          hostGateway: 'https://api-xquenda-testing.xst.mx',
          apiKey: 'd8d9941c-f4b9-47e8-b17b-4920dd68ea91',
          monitorPdfPath: '/home/developer/pdf',
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
}
