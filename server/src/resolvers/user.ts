import argon2 from "argon2";
import {
    Arg,
    Ctx,
    Field,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver
} from "type-graphql";
import { EntityManager } from "@mikro-orm/postgresql";

import { MyContext } from "src/types";

import { User } from "../entities/User";

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;

    @Field()
    password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: Array<FieldError>;

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(@Ctx() { orm, req }: MyContext): Promise<User | null> {
        // you are not logged in
        if (!req.session.userId) {
            return null;
        }

        const user = await orm.em.findOne(User, { id: req.session.userId });

        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { orm, req }: MyContext
    ): Promise<UserResponse> {
        if (options.username.length <= 2) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "username is too short"
                    }
                ]
            };
        }

        if (options.password.length <= 5) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "password is too short"
                    }
                ]
            };
        }

        const hashedPass = await argon2.hash(options.password);
        
        let user;

        try {
            const result = await (orm.em as EntityManager)
                .createQueryBuilder(User)
                .getKnexQuery()
                .insert({
                    username: options.username,
                    password: hashedPass,
                    created_at: new Date(),
                    updated_at: new Date()
                })
                .returning("*");
            user = result[0];
        } catch (err) {
            // duplicate username error
            if (
                err.code === "23505"
                // || err.detail.includes("already exists")
            )
                return {
                    errors: [
                        {
                            field: "username",
                            message: "username already taken"
                        }
                    ]
                };
        }

        req.session.userId = user.id;

        return {
            user
        };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { orm, req }: MyContext
    ): Promise<UserResponse> {
        const user = await orm.em.findOne(User, {
            username: options.username
        });

        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "invalid login"
                    }
                ]
            };
        }

        const valid = await argon2.verify(user.password, options.password);

        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Invalid login"
                    }
                ]
            };
        }

        req.session.userId = user.id;

        return {
            user
        };
    }
}
