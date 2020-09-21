import { Post } from "../entities/Post";
import {
    Arg,
    Ctx,
    Field,
    InputType,
    Int,
    Mutation,
    Query,
    Resolver,
    UseMiddleware
} from "type-graphql";

import { MyContext } from "src/types";

import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";

@InputType()
class PostInput {
    @Field()
    title!: string;

    @Field()
    text!: string;
}

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    async posts(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string
    ): Promise<Array<Post>> {
        // caps the limit at 50
        const realLimit = Math.min(50, limit);

        const qb = getConnection()
            .getRepository(Post)
            .createQueryBuilder("p")
            /**
             * we need to use double quotations here so
             * postgresql knows what column to look for.
             */
            .orderBy('"createdAt"', "DESC")
            .take(realLimit);

        if (cursor) {
            qb.where('"createdAt" < :cursor', { cursor: new Date(+cursor) });
        }

        return qb.getMany();

        // using the sleeper function to show how SSR works
        // await sleep(3000);
    }

    @Query(() => Post, { nullable: true })
    post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("options") options: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {
        return Post.create({
            ...options,
            authorId: +req.session.userId
        }).save();
    }

    @Mutation(() => Post, { nullable: true })
    async editPost(
        @Arg("id") id: number,
        @Arg("title", () => String, { nullable: true }) title: string
    ): Promise<Post | undefined> {
        const post = await Post.findOne(id);

        if (!post) return undefined;

        // in the case that they don't provide a new title
        if (typeof title !== undefined) {
            await Post.update({ id }, { title });
        }

        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(@Arg("id", () => Int) id: number): Promise<boolean> {
        await Post.delete(id);
        return true;
    }
}
