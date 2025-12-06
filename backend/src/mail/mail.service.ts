import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  private async sendMailTemplate(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ): Promise<any> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      return { message: 'Email Sent successfully' };
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}
