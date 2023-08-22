import { Injectable } from '@nestjs/common';
import { createClient } from 'soap';

@Injectable()
export class PxlabService {
  enviarServicios(stringServicio: string): Promise<{
    MuestraResult: string;
  }> {
    return new Promise((resolve, reject) => {
      try {
        createClient(
          'http://192.168.0.100:4005',
          { envelopeKey: 'soapenv' },
          (errorCreateClient, Cliente) => {
            if (errorCreateClient) {
              return reject(errorCreateClient);
            }
            Cliente.Muestra(
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
