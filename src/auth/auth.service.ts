import { Injectable } from '@nestjs/common';
import { AdminsService } from 'src/admins/admins.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtStrategy } from './jwt.strategy';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminsService: AdminsService,
    private readonly jwtService: JwtService,
    private readonly jwtStrategy: JwtStrategy,
  ) {}

  async createToken(userInfo) {
    const payload = {
      email: userInfo.email,
      sub: userInfo.id,
      role: userInfo.role,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
      }),
    };
  }

  async decodeToken(req: Request) {
    const access_token = req.cookies.jwtToken.access_token;
    const payload = this.jwtService.decode(access_token);
    const result = this.jwtStrategy.validate(payload);
    return result;
  }

  async validateUser(loginInfo) {
    let userInfoByEmail;

    if (loginInfo.email.includes(process.env.ADMIN_EMAIL_FORMAT)) {
      userInfoByEmail = await this.adminsService.findAdminByEmail(
        loginInfo.email,
      );
    } else {
      userInfoByEmail = await this.usersService.findUserByEmail(
        loginInfo.email,
      );
    }

    const isValidPassword = await bcrypt.compare(
      loginInfo.password,
      userInfoByEmail[0].passwordHash,
    );

    if (
      !userInfoByEmail[0] ||
      (userInfoByEmail[0].role === 'user' &&
        !userInfoByEmail[0].emailApproved) ||
      !isValidPassword
    ) {
      return false;
    }

    return userInfoByEmail[0];
  }
}
