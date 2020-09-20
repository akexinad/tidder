import { Post } from "../entities/Post";
import { Arg, Int, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    async posts(): Promise<Array<Post>> {
        // using the sleeper function to show how SSR works
        // await sleep(3000);
        return Post.find();
    }

    @Query(() => Post, { nullable: true })
    post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    async createPost(@Arg("title", () => String) title: string): Promise<Post> {
        return Post.create({ title }).save();
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
