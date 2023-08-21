import { Global, Module } from '@nestjs/common';
import { EstudiosPdfService } from './estudios-pdf.service';
@Global()
@Module({
  providers: [EstudiosPdfService],
  exports: [EstudiosPdfService],
})
export class EstudiosPdfModule {}
