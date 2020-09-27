import { Field, ObjectType } from "type-graphql";
import {
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
    Column,
    Entity,
    BaseEntity, ManyToOne
} from "typeorm";
import { User } from "./User";

/**
 * the @ObjectType() tells type graphql to
 * refer to this class as a type as well so
 * we can use it to infer the type the
 * resolvers Query decorator
 */
@ObjectType()
@Entity()
export class Post extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    title!: string;

    @Field()
    @Column()
    text!: string;

    @Field()
    @Column({type: "int", default: 0})
    points!: number;
    
    @Field()
    @Column()
    authorId: number;
    
    @Field()
    @ManyToOne(() => User, user => user.posts)
    author: User;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}
