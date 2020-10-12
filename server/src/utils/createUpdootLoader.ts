import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";

type UpdootKeys = Partial<Updoot>;

export const createUpdootLoader = () => {
    return new DataLoader<UpdootKeys, Updoot | null>(async (updootKeys) => {
        const updoots = await Updoot.findByIds(updootKeys as any);

        const updootIdsToUpdoot: Record<string, Updoot> = {};

        updoots.forEach(
            (updoot) =>
                (updootIdsToUpdoot[
                    `${updoot.userId} | ${updoot.postId}`
                ] = updoot)
        );

        return updootKeys.map(
            (key) => updootIdsToUpdoot[`${key.userId} | ${key.postId}`]
        );
    });
};
