import { Injectable } from '@nestjs/common';
import { ConfigValues } from './dto/config.values';
import { readFileSync, writeFileSync } from 'fs';

@Injectable()
export class ConfiguracionService {
  async getConfig(): Promise<ConfigValues> {
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
