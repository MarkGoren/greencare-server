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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GatheringsService } from './gatherings.service';

@Controller('gatherings')
export class GatheringsController {
  constructor(private readonly gatheringsService: GatheringsService) {}

  @Get('getAll/:type')
  async getAll(
    @Param('type')
    type: 'locations' | 'gatherings' | 'closedGatherings',
    @Req() req,
    @Res() res,
  ) {
    const allTypeObjects = await this.gatheringsService.getAll(req, type);
    return res.status(HttpStatus.OK).json(allTypeObjects);
  }

  @Post('createNew')
  async addLocationOrGathering(@Body() data, @Req() req, @Res() res) {
    const result = await this.gatheringsService.addLocationOrGathering(
      req,
      data,
    );

    if (result[0].users.length)
      return res.status(HttpStatus.OK).json('gathering created successfully!');
    return res.status(HttpStatus.OK).json('location added successfully!');
  }

  @Post('addUser')
  async addUserToGathering(@Body() data, @Req() req, @Res() res) {
    const result = await this.gatheringsService.addUserToGathering(req, data);

    if (!result[0])
      throw new HttpException(
        'something went wrong!',
        HttpStatus.EXPECTATION_FAILED,
      );
    return res
      .status(HttpStatus.OK)
      .json('user added to gathering successfully!');
  }

  @Post('removeUser')
  async removeUserFromGathering(@Body() data, @Req() req, @Res() res) {
    const gatheringId = data.gatheringId;
    const result = await this.gatheringsService.removeUserFromGathering(
      req,
      gatheringId,
    );
    if (!result)
      throw new HttpException('something went wrong!', HttpStatus.BAD_REQUEST);
    return res.status(HttpStatus.OK).json('user removed successfully!');
  }

  @Post('checkUserGatheringRole')
  async checkUserGatheringRole(
    @Body() data,
    @Req() req,
    @Res() res,
  ): Promise<{ userGatheringRole: 'host' | 'attendee' | 'viewer' }> {
    const gatheringId = data.gatheringId;
    const userGatheringRole =
      await this.gatheringsService.checkUserGatheringRole(req, gatheringId);
    return { userGatheringRole: userGatheringRole };
  }

  @Post('approveUserLocation')
  async approveUserLocation(@Body() data, @Req() req, @Res() res) {
    const result = await this.gatheringsService.approveUserLocation(
      req,
      data.gatheringId,
    );

    if (!result)
      throw new HttpException(
        'something went wrong!',
        HttpStatus.EXPECTATION_FAILED,
      );
    return res.status(HttpStatus.OK).json('users location approved!');
  }

  @Post('closeGathering')
  async closeGathering(@Body() data, @Req() req, @Res() res) {
    const result = await this.gatheringsService.closeGathering(data, req);
    if (!result)
      throw new HttpException(
        'something went wrong...',
        HttpStatus.EXPECTATION_FAILED,
      );
    return res.status(HttpStatus.OK).json('gathering closed successfully!');
  }

  @Post('updateGatheringStatus/:newStatus')
  async updateGatheringStatus(
    @Param('newStatus') newStatus: 'approved' | 'denied',
    @Body() data,
    @Req() req,
    @Res() res,
  ) {
    if (!(newStatus === 'approved' || newStatus === 'denied'))
      throw new HttpException('invalid status!', HttpStatus.BAD_REQUEST);

    const result = await this.gatheringsService.updateGatheringStatus(
      req,
      data,
      newStatus,
    );
    if (!result)
      throw new HttpException(
        'something went wrong!',
        HttpStatus.EXPECTATION_FAILED,
      );
    return res.status(HttpStatus.OK).json('status updated successfully!');
  }
}
