import crypto from 'crypto';

export const cloudFrontUrl = 'https://d1ydesjkdtpjgo.cloudfront.net/';

export const templates = {
  confirmEmail: process.env.CONFIRM_TEMPLATE_ID,
  forgottenPassword: process.env.FORGOTTEN_PASSWORD_TEMPLATE_ID,
};

export const state = crypto?.randomBytes(16).toString('hex');
