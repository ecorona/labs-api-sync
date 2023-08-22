export class LastUserCheck {
  lastUser: {
    id: number;
    nombreCompleto: string;
    contrato: {
      empleado: {
        nombreCompleto: string;
      };
      puesto: {
        nombre: string;
        departamento: {
          nombre: string;
        };
      };
    };
  };
  lastUserCheck: boolean;
  escaneando: boolean;
}
