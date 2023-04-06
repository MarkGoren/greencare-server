import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admins, AdminsDocument } from 'src/schemas/admins.schema';

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
}
