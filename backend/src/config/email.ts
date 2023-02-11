import { BadRequestException, HttpStatus } from '@nestjs/common';
import { MailerSend, EmailParams, Recipient } from 'mailersend';

export const send = async (data: {
  templateVersion: string;
  verificationUrl: string;
  email: string;
  emails: string;
  title: string;
  username: string;
}): Promise<
  { statusCode: HttpStatus; message: string } | BadRequestException
> => {
  try {
    const mailersend = new MailerSend({ apiKey: process.env.MAILERSEND_URL });

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
            value: data.emails,
          },
        ],
      },
    ];

    const emailParams = new EmailParams()
      .setFrom({ email: data.emails })
      .setTo(recipients)
      .setReplyTo({ email: data.emails })
      .setSubject(data.title)
      .setTemplateId(process.env.MAILERSEND_TEMPLATE_ID)
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
