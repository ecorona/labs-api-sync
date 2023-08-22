import { Module } from '@nestjs/common';
import { PxlabService } from './pxlab.service';

@Module({
  providers: [PxlabService],
  exports: [PxlabService],
})
export class PxlabModule {}
