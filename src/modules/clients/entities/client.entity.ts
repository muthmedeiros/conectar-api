import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ClientStatus } from '../enums/client-status.enum';


@Entity('clients')
export class ClientEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    corporateReason: string;

    @Column({ unique: true })
    cnpj: string;

    @Column()
    name: string;

    @Column({ type: 'text', default: ClientStatus.ACTIVE })
    status: ClientStatus;

    @Column({ default: false })
    conectarPlus: boolean;

    @Column('uuid')
    adminUserId: string;

    @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'adminUserId' })
    adminUser: UserEntity;

    @ManyToMany(() => UserEntity, 'clients')
    @JoinTable({
        name: 'client_users',
        joinColumn: { name: 'clientId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
    })
    users: UserEntity[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}