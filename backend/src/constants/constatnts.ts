import crypto from 'crypto';

export const cloudFrontUrl = `${process.env.S3_URL}`;

export const templates = {
  confirmEmail: process.env.CONFIRM_TEMPLATE_ID,
  forgottenPassword: process.env.FORGOTTEN_PASSWORD_TEMPLATE_ID,
};

export const emails = {
  confirmEmail: process.env.NO_REPLY_EMAIL,
  forgottenPasswordEmail: process.env.NO_REPLY_EMAIL,
};

export const titles = {
  confirm: 'Confirm your email',
  forgotten: 'Reset password',
};

export const state = crypto?.randomBytes(16).toString('hex');
