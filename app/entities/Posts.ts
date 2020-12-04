import { ObjectType, Field } from "type-graphql";
// import * as mongoose from "mongoose";
import {
  prop as Property,
  getModelForClass,
  modelOptions,
} from "@typegoose/typegoose";
// import { PostResponse } from "../resolvers/post";

@ObjectType({ description: "The Posts Model" })
// @modelOptions({ options: { customName: "jack" } })
export class Post {
  // field is graphql ex. String or [Int]!
  @Field()
  // @Property()
  _id: string;

  @Field()
  // this is the property in the db and uses typescript so string, string[]
  @Property({ required: true, nullable: false })
  title: string;

  @Field()
  @Property({ required: true, nullable: false })
  content: string;

  @Field()
  @Property({ required: true, nullable: false })
  creatorId: string;

  @Field()
  createdAt: number;

  @Field()
  updatedAt: number;
}

export const PostModel = getModelForClass(Post, {
  schemaOptions: { timestamps: true, collection: "jack" },
});
