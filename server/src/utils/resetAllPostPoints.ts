import { Post } from "../entities/Post";

/**
 * To reset the upvotes and the upvote status of the users.
 * The Updoots can simply be deleted via the postgres CLI.
 *
 * Resetting all the points is done easier with
 * the function below when needed.
 */

export const resetAllPostPoints = async () => {
    const posts = await Post.find();

    const postIds = posts.map((post) => post.id);

    await Post.update(postIds, {
        points: 0
    });
};
