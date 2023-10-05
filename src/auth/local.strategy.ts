import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(userInfo) {
    const user = await this.authService.validateUser(userInfo);
    if (!user) {
      throw new HttpException('unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}
