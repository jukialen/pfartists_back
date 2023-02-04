import Joi from 'joi';

export const GroupsPipe = Joi?.object({
  name: Joi.string().min(5).max(20).required(),
  description: Joi.string().required().min(5),
  adminId: Joi.string().required(),
  moderatorsId: Joi.string().optional(),
  usersId: Joi.string().optional(),
  logoUrl: Joi.string().optional(),
});

export const GroupsUpdatePipe = Joi?.object({
  name: Joi.string().min(5).max(20).optional(),
  description: Joi.string().optional().min(5),
  adminId: Joi.string().optional(),
  moderatorsId: Joi.string().optional(),
  usersId: Joi.string().optional(),
  logoUrl: Joi.string().optional(),
});
