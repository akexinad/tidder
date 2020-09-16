import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

/**
 * the @ObjectType() tells type graphql to 
 * refer to this class as a type as well so 
 * we can use it to infer the type the resolvers
 * Query decorator
 */
@ObjectType()
@Entity()
export class Post {
    @Field()
    @PrimaryKey()
    id!: number;

    // these decorators tell postgres that these are columns, not just fields in the class.
    @Field(() => String)
    @Property({ type: "date" })
    createdAt = new Date();

    @Field(() => String)
    @Property({ type: "date", onUpdate: () => new Date() })
    updatedAt = new Date();

    @Field()
    @Property({ type: "text" })
    title!: string;
}
