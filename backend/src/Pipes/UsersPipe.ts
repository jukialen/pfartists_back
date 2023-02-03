import Joi, { ObjectSchema } from 'joi';
import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export const UsersPipe = Joi?.object({
  username: Joi.string()
    .min(3)
    .required()
    .regex(/^[A-Z]/g)
    .regex(/\D/g)
    .regex(/[a-ząćęłńóśźżĄĘŁŃÓŚŹŻぁ-んァ-ヾ一-龯]*/g),
  pseudonym: Joi.string()
    .required()
    .min(5)
    .max(15)
    .regex(/[0-9０-９]+/g)
    .regex(/[#?!@$%^&*-＃？！＄％＆＊ー]+/g)
    .regex(/[a-ząćęłńóśźżĄĘŁŃÓŚŹŻぁ-んァ-ヾ一-龯]*/g),
  email: Joi.string().email().required(),
  description: Joi.string().required(),
  updateAt: Joi.date().timestamp().optional(),
  plan: Joi.string().valid('FREE', 'PREMIUM', 'GOLD'),
}).options({
  abortEarly: false,
});

export class SuperTokensUsersPipe {
  @IsEmail()
  email: string;

  @MinLength(9)
  @Matches(/[A-Z]+/g)
  @Matches(/[a-ząćęłńóśźżĄĘŁŃÓŚŹŻぁ-んァ-ヾ一-龯]*/g)
  @Matches(/[0-9]+/g)
  @Matches(/[#?!@$%^&*-]+/g)
  @IsNotEmpty()
  password: string;
}

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}
  transform(value: unknown) {
    const { error } = this.schema.validate(value);
    if (error) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }
}
