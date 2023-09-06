import Joi from 'joi';

export const GroupsPipe = Joi?.object({
  name: Joi.string()
    .min(5, 'Group name is too short.')
    .max(20, 'Group name is too long.')
    .required(),
  description: Joi.string().required().min(5, 'description is too short'),
  regulation: Joi.string().optional(),
  logo: Joi.string().optional(),
  adminId: Joi.string().required(),
  createdAt: Joi.date().timestamp().optional(),
  updatedAt: Joi.date().timestamp().optional(),
  usersGroups: Joi.optional(),
  posts: Joi.optional(),
  files: Joi.optional(),
});
