import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { EstudiosPdfModule } from './estudios-pdf/estudios-pdf.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'dist/www'),
      renderPath: '/',
    }),
    EstudiosPdfModule,
  ],
})
export class AppModule {}
