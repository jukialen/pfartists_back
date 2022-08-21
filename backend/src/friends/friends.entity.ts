import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "FRIENDS" })
export class Friends {
  @PrimaryGeneratedColumn('uuid')
  ID: string;

  @Column({ type: 'varchar2', length: 80 })
  USERNAME_ID: string;
  
  @Column({ type: 'varchar2', length: 80 })
  FRIEND_ID: string;
}