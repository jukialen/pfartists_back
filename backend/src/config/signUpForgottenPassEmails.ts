import { BadRequestException, HttpStatus } from '@nestjs/common';
import { MailerSend, EmailParams, Recipient } from 'mailersend';

export const send = async (data: {
  templateVersion: string;
  verificationUrl: string;
  email: string;
  emailFrom: string;
  supportEmail: string;
  title: string;
  username: string;
}): Promise<
  { statusCode: HttpStatus; message: string } | BadRequestException
> => {
  try {
    const mailersend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY,
    });

    const recipients = [new Recipient(data.email, 'New user')];

    const variables = [
      {
        email: data.email,
        substitutions: [
          {
            var: 'verificationUrl',
            value: data.verificationUrl,
          },
          {
            var: 'username',
            value: data.username || '',
          },
          {
            var: 'contactEmail',
            value: data.supportEmail,
          },
        ],
      },
    ];

    const emailParams = new EmailParams()
      .setFrom({ email: data.emailFrom })
      .setTo(recipients)
      .setReplyTo({ email: data.supportEmail })
      .setSubject(data.title)
      .setTemplateId(data.templateVersion)
      .setVariables(variables);

    await mailersend.email.send(emailParams);

    return {
      statusCode: HttpStatus.OK,
      message: 'E-mail sent successfully.',
    };
  } catch (e) {
    throw new BadRequestException(e.message);
  }
};
