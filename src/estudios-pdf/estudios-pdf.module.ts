import { Global, Module } from '@nestjs/common';
import { EstudiosPdfService } from './estudios-pdf.service';
import { HttpModule } from '@nestjs/axios';
import { GatewayModule } from 'src/gateway/gateway.module';
@Global()
@Module({
  imports: [HttpModule, GatewayModule],
  providers: [EstudiosPdfService],
  exports: [EstudiosPdfService],
})
export class EstudiosPdfModule {}
