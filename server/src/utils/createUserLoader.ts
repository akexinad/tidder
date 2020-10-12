import DataLoader from "dataloader";
import { User } from "../entities/User";

/**
 * This DataLoader will batch our user fetching so we don't
 * fetch the same user twice.
 *
 * This increases performance significantly.
 */

export const createUserLoader = () => {
    return new DataLoader<number, User>(async (userIds) => {
        const users = await User.findByIds(userIds as Array<number>);

        const userIdToUser: Record<number, User> = {};

        users.forEach((user) => (userIdToUser[user.id] = user));

        return userIds.map((userId) => userIdToUser[userId]);
    });
};
