import { Entity, OneToMany } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { Post } from "./Post";
import { Updoot } from "./Updoot";

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

    @Field()
    @Column({ unique: true })
    username!: string;

    @Field()
    @Column({ unique: true })
    email!: string;

    // we remove the field property so you cannot query it.
    @Column()
    password!: string;

    @OneToMany(() => Post, (post) => post.author)
    posts: Array<Post>;

    @OneToMany(() => Updoot, (updoot) => updoot.user)
    updoots: Array<Updoot>;

    // Adding the field decortor will expose the property to graphql
    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
}
