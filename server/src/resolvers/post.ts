import { Post } from "../entities/Post";
import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    InputType,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root,
    UseMiddleware
} from "type-graphql";
import { getConnection } from "typeorm";

import { MyContext } from "src/types";

import { isAuth } from "../middleware/isAuth";

@InputType()
class PostInput {
    @Field()
    title!: string;

    @Field()
    text!: string;
}

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts: Post[];
    @Field()
    hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
    /**
     * this resolver will let us call for textSnippet instead of text
     * from our front end so we don't need to download all the data.
     */
    @FieldResolver(() => String)
    textSnippet(@Root() root: Post) {
        return root.text.slice(0, 50) + "...";
    }

    @Query(() => PaginatedPosts)
    async posts(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string
    ): Promise<PaginatedPosts> {
        // caps the limit at 50
        const realLimit = Math.min(50, limit);

        const realLimitPlusOne = realLimit + 1;

        const qb = getConnection()
            .getRepository(Post)
            .createQueryBuilder("p")
            /**
             * we need to use double quotations here so
             * postgresql knows what column to look for.
             */
            .orderBy('"createdAt"', "DESC")
            .take(realLimitPlusOne);

        if (cursor) {
            qb.where('"createdAt" < :cursor', { cursor: new Date(+cursor) });
        }

        const posts = await qb.getMany();

        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne
        };
    }

    @Query(() => Post, { nullable: true })
    post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    /**
     * Example of how only authorized users are allowed
     * to create posts.
     */
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
