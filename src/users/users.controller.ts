import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from 'src/auth/auth.service';
import { LocalStrategy } from 'src/auth/local.strategy';
import { SendgridService } from 'src/sendgrid/sendgrid.service';
import { UsersService } from './users.service';
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly localStrategy: LocalStrategy,
    private readonly authService: AuthService,
    private readonly sendgridService: SendgridService,
  ) {}

  @Post('register')
  async userRegister(
    @Body() userInfo: { email: string; password: string; fullName: string },
    @Req() req,
    @Res() res,
  ) {
    const result = await this.usersService.createUser(userInfo);

    this.sendgridService.sendVerificationEmail(result).then(() => {
      return res
        .status(HttpStatus.CREATED)
        .json('user registered succesfully!');
    });
  }

  @Post('login')
  async loginUser(
    @Body() loginInfo: { email: string; password: string },
    @Req() req,
    @Res() res,
  ) {
    const userInfo = await this.localStrategy.validate(loginInfo);

    if (userInfo) {
      const jwtToken = await this.authService.createToken(userInfo);
      const userInfoForSession = {
        fullName: userInfo.fullName,
        profileImg: userInfo.profileImg,
        coins: userInfo.coins,
        xp: userInfo.xp,
        role: userInfo.role,
      };

      req.session.userInfo = userInfoForSession;
      res.cookie('jwtToken', jwtToken, {
        httpOnly: true,
      });
      //res.cookie('userInfo', userInfoForCookie);
      return res.redirect(
        HttpStatus.OK,
        `https://${process.env.CLIENT_DOMAIN}`,
      );
    }
  }

  @Get('verifyEmail/:encryptedUserId')
  async verifyEmail(
    @Param('encryptedUserId') encryptedUserId,
    @Req() req,
    @Res() res,
  ) {
    const result = await this.usersService.verfiyEmail(encryptedUserId);
    if (result)
      return res.redirect(
        HttpStatus.OK,
        `http://${process.env.CLIENT_DOMAIN}/login`,
      );
  }

  @Post('sendResetPasswordLink')
  async sendResetPasswordLink(
    @Body() data: { email: string },
    @Req() req,
    @Res() res,
  ) {
    const userInfo = await this.usersService.getUserInfoForPasswordReset(
      data.email,
    );
    this.sendgridService.sendResetPasswordLinkEmail(userInfo[0]).then(() => {
      return res.status(200).json('reset password link sent successfully!');
    });
  }

  @Get('changePassword/:encryptedUserId')
  async changePasswordPageRedirct(
    @Param('encryptedUserId') encryptedUserId,
    @Req() req,
    @Res() res,
  ) {
    const thirtyMinExpiration = new Date(Date.now() + 30 * 60 * 1000);
    res.cookie('encryptedUserId', encryptedUserId, {
      httpOnly: true,
      expires: thirtyMinExpiration,
    });
    return res.redirect(
      HttpStatus.OK,
      `http://${process.env.CLIENT_DOMAIN}/changePassword`,
    );
  }

  @Post('resetPassword')
  async resetPassword(@Body() data, @Req() req, @Res() res) {
    const encryptedUserId = req.cookies.encryptedUserId;
    const newPassword = data.newPassword;
    if (!encryptedUserId)
      throw new HttpException('user id has expired!', HttpStatus.BAD_REQUEST);
    this.usersService
      .setNewPassword(encryptedUserId, newPassword)
      .then(() => {
        return res.status(HttpStatus.OK).json('new password set successfully!');
      })
      .catch((err) => {
        throw new HttpException(
          JSON.stringify(err),
          HttpStatus.EXPECTATION_FAILED,
        );
      });
  }

  @Post('updateProfile')
  async updateProfile(@Body() data, @Req() req, @Res() res) {
    const userInfo = await this.authService.decodeToken(req);
    this.usersService
      .updateProfileImg(data.newProfileImg, userInfo)
      .then(() => {
        return res
          .status(HttpStatus.OK)
          .json('profile image was changed successfully!');
      });
  }
}
