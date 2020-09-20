import { Entity } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

/**
 * the @ObjectType() tells type graphql to
 * refer to this class as a type as well so
 * we can use it to infer the type the
 * resolvers Query decorator
 */
@ObjectType()
@Entity()
export class User extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    // Adding the field decortor will expose the property to graphql
    @Field(() => String)
    // the property decorator tells postgres that these are columns, not just fields in the class.
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(() => String)
    @Column({ unique: true })
    username!: string;

    @Field(() => String)
    @Column({ unique: true })
    email!: string;

    // we remove the field property so you cannot query it.
    @Column()
    password!: string;
}
