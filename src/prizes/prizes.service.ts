import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { Prizes, PrizesDocument } from 'src/schemas/prizes.schema';
import * as bcrypt from 'bcrypt';
import { SendgridService } from 'src/sendgrid/sendgrid.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PrizesService {
  constructor(
    @InjectModel(Prizes.name)
    private readonly prizesModel: Model<PrizesDocument>,
    private readonly authService: AuthService,
    private readonly sendgridService: SendgridService,
    private readonly usersService: UsersService,
  ) {}

  async addNewPrize(data, req) {
    const userInfo = await this.authService.decodeToken(req);
    if (userInfo.role !== 'admin')
      throw new HttpException(
        'unauthorized, access denied!',
        HttpStatus.UNAUTHORIZED,
      );

    const createdPrize = new this.prizesModel({
      storeName: data.storeName,
      prizeDesc: data.prizeDesc,
      img: data.imgUrl,
      amountAvailable: data.codes.split(',').length,
      cost: data.cost,
      codes: data.codes.split(','),
    });

    const resultPrize = await createdPrize.save();
    const hashedId = await bcrypt.hash(resultPrize._id.toHexString(), 10);
    resultPrize.hashedId = hashedId;
    const result = await resultPrize.save();
    return result;
  }

  // in future when details update - check correlation and build exceptions
  async updatePrizeDetails(prizeHashedId, data, req) {
    const userInfo = await this.authService.decodeToken(req);
    if (userInfo.role !== 'admin')
      throw new HttpException(
        'unauthorized, access denied!',
        HttpStatus.UNAUTHORIZED,
      );

    const resultPrize = await this.getPrizeByHashedId(prizeHashedId);

    data.keys().forEach((key) => {
      if (key in resultPrize) {
        resultPrize[key] = data[key];
      }
    });

    const result = await resultPrize.save();
    return result;
  }

  async getAllPrizes() {
    const prizes = await this.prizesModel.find({}, { _id: 0, codes: 0 });
    return prizes;
  }

  async getPrizeByHashedId(prizeHashedId) {
    const allPrizes = await this.prizesModel.find({});
    const resultPrize = allPrizes.find(async (prize) => {
      return await bcrypt.compare(prize._id.toHexString(), prizeHashedId);
    });
    if (!resultPrize)
      throw new HttpException('wrong prize id!', HttpStatus.BAD_REQUEST);
    return resultPrize;
  }

  async buyPrize(hashedPrizeId, req) {
    const userInfo = await this.authService.decodeToken(req);
    const resultPrize = await this.getPrizeByHashedId(hashedPrizeId);
    const resultUser = await this.usersService.findUserById(userInfo.userId);
    if (resultUser.coins < resultPrize.cost)
      throw new HttpException(
        'not enough coins to complete purchase!',
        HttpStatus.BAD_REQUEST,
      );
    const couponCode = resultPrize.codes.pop();
    resultPrize.amountAvailable -= 1;
    resultUser.coins -= resultPrize.cost;
    const result = await this.sendgridService.sendPruchasedPrizeEmail(
      userInfo,
      resultPrize,
      couponCode,
    );
    const action = {
      name: resultPrize.prizeDesc,
      action: 'you purchased a prize',
      img: resultPrize.img,
      time: new Date(),
    };
    resultUser.actions.push(action);
    const updatedUser = await resultUser.save();
    const updatedPrize = await resultPrize.save();
    return Promise.all([result, updatedPrize, updatedUser]);
  }
}
