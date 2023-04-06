import { Injectable } from '@nestjs/common';
import * as SendGrid from '@sendgrid/mail';
import { CryptoService } from 'src/crypto/crypto.service';
import { UsersDocument } from 'src/schemas/users.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class SendgridService {
  constructor(
    private readonly userService: UsersService,
    private readonly cryptoService: CryptoService,
  ) {
    SendGrid.setApiKey(process.env.SENDGRID_KEY);
  }

  async sendVerificationEmail(userInfo) {
    const encryptedUserId = await this.cryptoService.encryptUserId(
      userInfo['id'],
    );

    const mail = {
      from: 'gormark2001@gmail.com',
      to: userInfo['email'],
      cc: '',
      templateId: process.env.EMAIL_VERIFICATION_TEMPLATE_ID,
      dynamicTemplateData: {
        link: `http://${process.env.SERVER_DOMAIN}/users/verifyEmail/${encryptedUserId}`,
      },
    };
    return SendGrid.send(mail);
  }

  async sendResetPasswordLinkEmail(userInfo) {
    const encryptedUserId = await this.cryptoService.encryptUserId(
      userInfo._id,
    );

    const mail = {
      from: 'gormark2001@gmail.com',
      to: userInfo.email,
      cc: '',
      templateId: process.env.RESET_PASSWORD_EMAIL_TEMPLATE_ID,
      dynamicTemplateData: {
        link: `http://${process.env.SERVER_DOMAIN}/users/changePassword/${encryptedUserId}`,
      },
    };
    return SendGrid.send(mail);
  }
}
