import sgMail from '@sendgrid/mail';
import { BadRequestException, HttpStatus } from '@nestjs/common';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const send = async (data: {
  templateVersion: string;
  email: string;
  verificationUrl: string;
}): Promise<
  { statusCode: HttpStatus; message: string } | BadRequestException
> => {
  try {
    const message = {
      from: process.env.CONFIRM_EMAIL_ADDRESS,
      to: data.email,
      template_id: data.templateVersion,
      dynamic_template_data: {
        verificationUrl: data.verificationUrl,
      },
      content: [
        {
          type: 'text/plain',
          value: 'huhuhu',
        },
      ],
    };

    await sgMail.send(message);

    return {
      statusCode: HttpStatus.OK,
      message: 'E-mail sent successfully.',
    };
  } catch (e) {
    throw new BadRequestException(e.message);
  }
};
