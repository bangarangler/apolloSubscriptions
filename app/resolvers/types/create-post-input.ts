import { InputType, Field } from "type-graphql";
// import { Length, IsEmail } from "class-validator";
import { Post } from "../../entities/Posts";
// import { ObjectId } from "mongodb";

@InputType()
export class CreatePostInput implements Partial<Post> {
  @Field()
  title: string;

  @Field()
  content: string;

  @Field()
  creatorId: string;
}
