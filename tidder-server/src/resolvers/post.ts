import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { Ctx, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts(@Ctx() ctx: MyContext): Promise<Array<Post>> {
        const { orm } = ctx;

        return orm.em.find(Post, {});
    }
}
