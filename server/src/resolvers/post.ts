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

import { MyContext } from "../types";

import { isAuth } from "../middleware/isAuth";
import { Updoot } from "../entities/Updoot";

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
        const sliced = root.text.slice(0, 50);

        return root.text.length > 50 ? sliced + "..." : sliced;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg("postId", () => Int) postId: number,
        @Arg("value", () => Int) value: number,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        const { userId } = req.session;

        const isUpdoot = value !== -1;
        const realValue = isUpdoot ? 1 : -1;

        const postToUpdate = await Post.findOne(postId);

        if (!postToUpdate) {
            console.error("404: Post Not Found");
            return false;
        }

        await Updoot.insert({
            userId,
            postId,
            value: realValue
        }).catch((error) => {
            console.error("Error Inserting Updoot", error);
        });

        await Post.update(
            { id: postId },
            { points: postToUpdate.points + realValue }
        ).catch((error) => {
            console.error("Error Updating Post", error);
        });

        return true;
    }

    @Query(() => PaginatedPosts)
    async posts(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string
    ): Promise<PaginatedPosts> {
        // caps the limit at 50
        const realLimit = Math.min(50, limit);

        const realLimitPlusOne = realLimit + 1;

        // const posts = await getConnection().query(
        // `
        // select p.*,
        // json_build_object(
        //     'id', u.id,
        //     'username', u.username,
        //     'email', u.email
        // ) author
        // from post p
        // inner join public.user u on u.id = p."authorId"
        // ${cursor ? `where p."createdAt" < $2` : ""}
        // order by p."createdAt" DESC
        // limit $1
        // `,
        //     replacements
        // );

        /**
         * Ben uses aliases in his tutorial which seems to not work
         * anymore. here if we just use the entity name and the
         * leftAndInnerJoin function, it all works normally without
         * having to use your own sql query as ben did above.
         *
         * However this might, idk yet.
         */

        const qb = getConnection()
            .getRepository(Post)
            .createQueryBuilder("post")
            /**
             * we need to use double quotations here so
             * postgresql knows what column to look for.
             */
            .leftJoinAndSelect("post.author", "user")
            .orderBy("post.createdAt", "DESC")
            .take(realLimitPlusOne);

        if (cursor) {
            qb.where("post.createdAt < :cursor", { cursor: new Date(+cursor) });
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
