import Joi from 'joi';

export const FriendsPipe = Joi?.object({
  usernameId: Joi.string().required(),
  friendId: Joi.string().required(),
  favorite: Joi.boolean().default(false),
  createAt: Joi.date().default(Date.now()),
  updateAt: Joi.date().default(Date.now),
});
