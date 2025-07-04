import Joi from 'joi';

export const UsersPipe = Joi?.object({
  username: Joi.string()
    .required()
    .min(3, 'Name is too short.')
    .regex(/^[A-Z]/g, 'First letter must be a big.')
    .regex(/\D/g, 'Name cannot include numbers')
    .regex(
      /[a-ząćęłńóśźżĄĘŁŃÓŚŹŻぁ-んァ-ヾ一-龯]*/g,
      'Name accept only letters. These can be Hiragana, Katakana and kanji characters',
    ),
  pseudonym: Joi.string()
    .required()
    .min(5, 'Pseudonym is too short.')
    .max(15, 'Pseudonym is too long. Must have a maximum 15 letters.')
    .regex(/[0-9０-９]+/g, 'Pseudonym must have at least 1 number.')
    .regex(
      /[#?!@$%^&*-＃？！＄％＆＊ー]+/g,
      'Pseudonym must include at least 1 special character: #?!@$%^&*-＃？！＄％＆＊ー',
    )
    .regex(
      /[a-ząćęłńóśźżĄĘŁŃÓŚŹŻぁ-んァ-ヾ一-龯]*/g,
      'Pseudonym accept only letters. These can be Hiragana, Katakana and kanji characters',
    ),
  description: Joi.string().required().min(5),
  updateAt: Joi.date().timestamp().optional(),
  plan: Joi.string().valid('FREE', 'PREMIUM', 'GOLD'),
}).options({
  abortEarly: false,
});
