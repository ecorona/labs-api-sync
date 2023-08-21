import { Global, Module } from '@nestjs/common';
import { EstudiosPdfService } from './estudios-pdf.service';
import { HttpModule } from '@nestjs/axios';
@Global()
@Module({
  imports: [HttpModule],
  providers: [EstudiosPdfService],
  exports: [EstudiosPdfService],
})
export class EstudiosPdfModule {}
