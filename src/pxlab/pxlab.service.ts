import { Injectable } from '@nestjs/common';
import { createClient } from 'soap';
import { ConfiguracionService } from 'src/configuracion/configuracion.service';

@Injectable()
export class PxlabService {
  private pxLabHost = '';
  constructor(private readonly configuracionService: ConfiguracionService) {
    this.pxLabHost = this.configuracionService.getValue('pxLabHost');
  }
  enviarServicios(stringServicio: string): Promise<{
    MuestraResult: string;
  }> {
    return new Promise((resolve, reject) => {
      try {
        createClient(
          this.pxLabHost, //configurable
          { envelopeKey: 'soapenv' },
          (errorCreateClient, ClienteSoap) => {
            if (errorCreateClient) {
              return reject(errorCreateClient);
            }
            ClienteSoap.Muestra(
              { Datos: stringServicio },
              async (errorMetodo, response) => {
                if (errorMetodo) {
                  return reject(errorMetodo);
                }
                return resolve(response);
              },
            );
          },
        );
      } catch (error) {
        return reject(error);
      }
    });
  }
}
