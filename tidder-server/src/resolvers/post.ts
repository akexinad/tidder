import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts(@Ctx() { orm }: MyContext): Promise<Array<Post>> {
        return orm.em.find(Post, {});
    }

    @Query(() => Post, { nullable: true })
    post(
        @Arg("id", () => Int) id: number,
        @Ctx() { orm }: MyContext
    ): Promise<Post | null> {
        return orm.em.findOne(Post, { id });
    }

    @Mutation(() => Post)
    async createPost(
        @Arg("title", () => String) title: string,
        @Ctx() { orm }: MyContext
    ): Promise<Post> {
        const post = orm.em.create(Post, { title });

        await orm.em.persistAndFlush(post);

        return post;
    }

    @Mutation(() => Post, { nullable: true })
    async editPost(
        @Arg("id") id: number,
        @Arg("title", () => String, { nullable: true }) title: string,
        @Ctx() { orm }: MyContext
    ): Promise<Post | null> {
        const post = await orm.em.findOne(Post, { id });

        if (!post) return null;

        // in the case that they don't provide a new title
        if (typeof title !== undefined) {
            post.title = title;
            await orm.em.persistAndFlush(post);
        }

        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg("id") id: number,
        @Ctx() { orm }: MyContext
    ): Promise<boolean> {
        const post = await orm.em.findOne(Post, { id });

        if (!post) return false;

        await orm.em.nativeDelete(Post, { id });
        return true;
    }
}
