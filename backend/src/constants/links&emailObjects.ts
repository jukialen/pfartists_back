import crypto from 'crypto';

export const cloudFrontUrl = `${process.env.S3_URL}`;

export const templates = {
  confirmEmail: process.env.CONFIRM_TEMPLATE_ID,
  forgottenPassword: process.env.FORGOTTEN_PASSWORD_TEMPLATE_ID,
};

export const emails = {
  confirmEmail: process.env.NO_REPLY_EMAIL,
  forgottenPasswordEmail: process.env.NO_REPLY_EMAIL,
  supportEmail: process.env.SUPPORT_EMAIL,
};

export const titles = {
  confirm: 'Confirm your email',
  forgotten: 'Reset password',
};

export const state = crypto?.randomBytes(16).toString('hex');

export const googleUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';
export const discordUrl = 'https://discordapp.com/api/v10/users/@me';
export const spotifyUrl = 'https://api.spotify.com/v1/me';
export const lineUrl = 'https://api.line.me/oauth2/v2.1/userinfo';
