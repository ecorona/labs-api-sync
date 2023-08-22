import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('syslog')
export class SyslogEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    type: 'datetime',
    nullable: true,
  })
  fecha: Date;

  @Column({
    type: 'varchar',
    nullable: true,
    length: 255,
  })
  message: string;
}
