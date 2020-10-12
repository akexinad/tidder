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
import { Post } from "../entities/Post";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

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

    /**
     * This solution to fetching relations is very poor on performance.
     *
     * It is advised that you use the 'DataLoader' library if you wish to use
     * these FieldResolver to fetch your relational data.
     */

    @FieldResolver(() => User)
    author(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
        // return User.findOne(post.authorId);

        /**
         * instead of returning a user for every single post, we use the
         * userLoader to return the unique users only once.
         */

        return userLoader.load(post.authorId);
    }

    /**
     * Another example with using loaders to batch our requests to the db.
     */

    /**
     * This example really didn't work that well.
     */

    @FieldResolver(() => Int, { nullable: true })
    async voteStatus(
        @Root() post: Post,
        @Ctx() { updootLoader, req }: MyContext
    ) {
        /**
         * By not being logged in we can state that
         * the user does not have a vote status.
         */
        if (!req.session.userId) {
            return null;
        }

        const updoot = await updootLoader.load({
            postId: post.id,
            userId: req.session.userId
        });

        return updoot ? updoot.value : null;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg("postId", () => Int) postId: number,
        @Arg("value", () => Int) value: number,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        const { userId } = req.session;

        const postToUpdate = await Post.findOne(postId);

        if (!postToUpdate) {
            console.error("404: Post Not Found");
            return false;
        }

        const updoot = await Updoot.findOne({ where: { postId, userId } });

        if (!updoot) {
            console.error("404: Updoot not found!");
        }

        /**
         * The user wants to remove their vote,
         * which means we need to delete the updoot.
         */
        if (updoot && value === updoot.value) {
            /**
             * Add a point if user's vote was initially negative,
             * and vice versa.
             */
            const newValue = value === -1 ? 1 : -1;

            await Updoot.delete({ userId, postId });

            await Post.update(
                { id: postId },
                { points: postToUpdate.points + newValue }
            );

            return true;
        }

        /**
         * The user is changing their vote from positive to negative and vice versa.
         */
        if (updoot && value !== updoot.value) {
            const newValue = value * 2;

            await Updoot.update({ postId, userId }, { value });
            await Post.update(
                { id: postId },
                { points: postToUpdate.points + newValue }
            );

            return true;
        }

        /**
         * Create a new updoot!
         */
        await Updoot.insert({
            userId,
            postId,
            value
        }).catch((error) => {
            console.error("Error Inserting Updoot", error);
        });

        await Post.update(
            { id: postId },
            { points: postToUpdate.points + value }
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
         * correctly. here if we just use the entity name and the
         * leftAndInnerJoin function, it all works normally without
         * having to use your own sql query as ben did above.
         */

        const qb = getConnection()
            .getRepository(Post)
            .createQueryBuilder("post")
            /**
             * we need to use double quotations here so
             * postgresql knows what column to look for.
             */

            /**
             * With the new author FieldResolver above, the User
             * will automatically be returned for us
             */

            // .leftJoinAndSelect("post.author", "user")
            .orderBy("post.createdAt", "DESC")
            .take(realLimitPlusOne);

        if (cursor) {
            qb.where("post.createdAt < :cursor", { cursor: new Date(+cursor) });
        }

        const posts = await qb.getMany();

        /**
         * NOTE!!!
         *
         * With the new upvote FielResolver that utilises
         * the DataLoader, we do not need this logic below anymore.
         */

        // const updoots = await Updoot.find();

        /**
         * checking if user has already updooted certain posts
         */

        // posts.map((post) => {
        //     const updooted = updoots.find(
        //         (updoot) =>
        //             updoot.postId === post.id &&
        //             updoot.userId === req.session.userId
        //     );

        //     if (updooted) {
        //         post.voteStatus = updooted.value;
        //     }

        //     return post;
        // });

        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne
        };
    }

    @Query(() => Post, { nullable: true })
    async post(@Arg("id", () => Int) id: number): Promise<Post | null> {
        // const post = await getConnection()
        //     .getRepository(Post)
        //     .createQueryBuilder("post")
        //     .leftJoinAndSelect("post.author", "user")
        //     .where(`post.id = ${id}`)
        //     .getOne();

        // const post = await Post.findOne(id, {
        //     relations: ["author"]
        // });

        /**
         * With the new author FieldResolver above, the User
         * will automatically be returned for us
         */
        const post = await Post.findOne(id);

        if (post === undefined) {
            console.error("There was error getting a single post");
            return null;
        }

        return post;
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

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
        @Arg("id", () => Int) id: number,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        const post = await Post.findOne(id);

        if (!post) {
            console.error("404: Post Not Found!");
            return false;
        }

        if (post.authorId !== req.session.userId) {
            console.error("403: Unauthorized to delete this post");
            return false;
        }

        await Updoot.delete({ postId: id });

        await Post.delete({ id });

        return true;
    }

    @Mutation(() => Post, { nullable: true })
    @UseMiddleware(isAuth)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("title") title: string,
        @Arg("text") text: string,
        @Ctx() { req }: MyContext
    ): Promise<Post | null> {
        const post = await Post.findOne(id);

        if (!post) {
            console.error("404: Post Not Found!");
            return null;
        }

        if (post.authorId !== req.session.userId) {
            console.error("403: Unauthorized to update this post");
            return null;
        }

        /**
         * 
        This is how you would do it with the query builder.
        
        await getConnection()
        .createQueryBuilder()
        .update(Post)
        .set({ 
            title,
            text
        })
        .where("id = :id and 'authorId' = :authorId", { id, authorId: req.session.userId })
        .returning("*")
        .execute();

        */

        await Post.update(
            { id },
            { title: title ? title : post.title, text: text ? text : post.text }
        );

        const updatedPost = await Post.findOne(id);

        if (!updatedPost) {
            console.error("404: Updated Post Not Found!");
            return null;
        }

        return updatedPost;
    }
}
