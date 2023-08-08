import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PrizesService } from './prizes.service';

@Controller('prizes')
export class PrizesController {
  constructor(private readonly prizesService: PrizesService) {}

  @Post('addNew')
  async addPrize(@Body() data, @Req() req, @Res() res) {
    this.prizesService
      .addNewPrize(data, req)
      .then(() => {
        return res.status(HttpStatus.OK).json('new prize added successfully!');
      })
      .catch((err) => {
        return res
          .status(HttpStatus.EXPECTATION_FAILED)
          .json(JSON.stringify(err));
      });
  }

  @Get('getAll')
  async getAllPrizes(@Req() req, @Res() res) {
    const result = await this.prizesService.getAllPrizes();
    if (!result)
      throw new HttpException(
        'something went wrong!',
        HttpStatus.EXPECTATION_FAILED,
      );
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('buyPrize')
  async buyPrize(@Req() req, @Res() res, @Body() data) {
    const result = await this.prizesService.buyPrize(data.hashedPrizeId, req);
    if (!result)
      throw new HttpException(
        'something went wrong!',
        HttpStatus.EXPECTATION_FAILED,
      );
    return res.status(HttpStatus.OK).json('prize purchased successfully!');
  }
}
