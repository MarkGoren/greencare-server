import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AdminsService } from './admins.service';

@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post('/register')
  async registerNewAdmin(
    @Body()
    data: {
      adminRegPassword: string;
      fullName: string;
      email: string;
      pasword: string;
    },
    @Req() req,
    @Res() res,
  ) {
    const result = await this.adminsService.registerNewAdmin(data);
    if (!result)
      throw new HttpException(
        'something went wrong!',
        HttpStatus.EXPECTATION_FAILED,
      );
    return res.status(HttpStatus.OK).json('new admin registered successfully!');
  }
}
