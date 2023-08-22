import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('archivos')
export class ArchivoEntity {
  @PrimaryColumn()
  hash: string;

  @Column()
  nombre: string;

  @CreateDateColumn()
  createdAt: Date;
}
