import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admins, AdminsDocument } from 'src/schemas/admins.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminsService {
  constructor(
    @InjectModel(Admins.name)
    private readonly adminsModel: Model<AdminsDocument>,
  ) {}

  async findAdminByEmail(email) {
    const result = await this.adminsModel.where('email').equals(email);
    return result;
  }

  async registerNewAdmin(data) {
    const isValidPassword = await bcrypt.compare(
      data.adminRegPassword,
      process.env.ADMIN_REGISTER_PASSWORD,
    );

    if (!isValidPassword)
      throw new HttpException('password incorrect!', HttpStatus.UNAUTHORIZED);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newAdmin = new this.adminsModel({
      fullName: data.fullName,
      email: data.email,
      passwordHash: hashedPassword,
    });
    return newAdmin.save();
  }
}
