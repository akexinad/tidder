import { Field, Int, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { Updoot } from "./Updoot";
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

    /**
     * This will only be a graphql value
     * not a column in the db.
     */
    @Field(() => Int, { nullable: true })
    voteStatus: number | null;

    @Field()
    @Column()
    text!: string;

    @Field()
    @Column({ type: "int", default: 0 })
    points!: number;

    @Field()
    @Column()
    authorId: number;

    @Field()
    @ManyToOne(() => User, (user) => user.posts)
    author: User;

    @OneToMany(() => Updoot, (updoot) => updoot.post)
    updoots: Array<Updoot>;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}
