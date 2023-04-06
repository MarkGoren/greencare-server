import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from 'src/schemas/users.schema';
import * as bcrypt from 'bcrypt';
import { CryptoService } from 'src/crypto/crypto.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private readonly usersModel: Model<UsersDocument>,
    private readonly cryptoService: CryptoService,
  ) {}

  async findUserByEmail(email) {
    const result = await this.usersModel.where('email').equals(email);
    return result;
  }

  async createUser(userInfo) {
    const existingUser = await this.findUserByEmail(userInfo.email);
    if (existingUser.length)
      throw new HttpException(
        'user with this email already exists!',
        HttpStatus.CONFLICT,
      );
    const hashedPassword = await bcrypt.hash(userInfo.password, 10);
    const createdUser = new this.usersModel({
      email: userInfo.email,
      passwordHash: hashedPassword,
      fullName: userInfo.fullName,
    });
    return createdUser.save();
  }

  async verfiyEmail(encryptedUserId) {
    const userId = await this.cryptoService.decryptUserId(encryptedUserId);
    const exists = await this.usersModel.exists({ _id: userId });
    if (!exists)
      throw new HttpException(
        'user id does not exist!',
        HttpStatus.BAD_REQUEST,
      );
    const result = await this.usersModel.findByIdAndUpdate(userId, {
      emailApproved: true,
    });
    return result;
  }

  async getUserInfoForPasswordReset(email: string) {
    const userInfo = await this.findUserByEmail(email);
    if (!userInfo.length)
      throw new HttpException(
        'user with this email does not exist!',
        HttpStatus.CONFLICT,
      );
    return userInfo;
  }

  async setNewPassword(encryptedUserId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const userId = await this.cryptoService.decryptUserId(encryptedUserId);
    const result = this.usersModel.findByIdAndUpdate(userId, {
      passwordHash: hashedPassword,
    });
    return result;
  }
}
