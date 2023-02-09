import Joi from 'joi';

export const GroupsPipe = Joi?.object({
  name: Joi.string()
    .min(5, 'Group name is too short.')
    .max(20, 'Group name is too long.')
    .required(),
  description: Joi.string().required().min(5),
  adminId: Joi.string().required(),
  moderatorsId: Joi.string().optional(),
  usersId: Joi.string().optional(),
  logoUrl: Joi.string().optional(),
});
