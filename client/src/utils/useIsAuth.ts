import { useEffect } from "react";
import { useRouter } from "next/router";

import { useMeQuery } from "../generated/graphql";

export const useIsAuth = () => {
    const router = useRouter();
    const [{ data, fetching }] = useMeQuery();

    console.log('router', router);

    useEffect(() => {
        if (!fetching && !data.me) {
            /**
             * we're telling the router to send the user to create-post
             * after they have been authenticated
             */
            router.replace("/login?next=" + router.pathname);
        }
    }, [fetching, data, router]);
};
