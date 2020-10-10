import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";

import { Post } from "./Post";
import { User } from "./User";

/**
 * This is an example of a many to many relationship
 * between user and post
 *
 * Many users can upvote the same post
 * And one user can upvote many posts
 *
 * User <-> Post
 *
 * User -> join table <- posts
 *
 * The join table is the Updoot
 *
 */

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {
    @Field()
    @Column({ type: "int" })
    value: number;

    @Field()
    @PrimaryColumn()
    userId: number;

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.updoots)
    user: User;

    @Field()
    @PrimaryColumn()
    postId: number;

    @Field(() => Post)
    @ManyToOne(() => Post, (post) => post.updoots)
    post: Post;
    
    // This is how you cascade delete
    // @ManyToOne(() => Post, (post) => post.updoots, {
    //     onDelete: "CASCADE"
    // })
}
