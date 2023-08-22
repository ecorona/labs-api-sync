export class TareaData {
  id: number;
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  event: string;
  channel: string;
  data: string; //'438988|0|N|1|Erik Ernesto|Corona|Vásquez|M|19/11/1977|eeecorona@gmail.com|A Quién Corresponda|100||Pruebas|9515042982|0|1992|',
  sucursalId: number;
  status: number;
  intentos: number;
  lastError: any;
}
