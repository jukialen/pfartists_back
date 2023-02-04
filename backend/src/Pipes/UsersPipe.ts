import Joi from 'joi';
import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

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
  description: Joi.string().required().min(5),
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
