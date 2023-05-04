import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { Gatherings, GatheringsDocument } from 'src/schemas/gatherings.schema';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class GatheringsService {
  constructor(
    @InjectModel(Gatherings.name)
    private readonly gatheringsModel: Model<GatheringsDocument>,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async addLocationOrGathering(req, data, images) {
    const userInfo = await this.authService.decodeToken(req);

    const uploadedImgsUrls = await this.cloudinaryService.uploadImages(
      images,
      'greencare_locations',
    );

    if ('time' in data) {
      const userNameAndProfile =
        await this.usersService.getUserNameAndProfileById(userInfo.userId);
      const hashedUserId = await bcrypt.hash(userInfo.userId, 10);
      const createdGathering = new this.gatheringsModel({
        imgsBefore: uploadedImgsUrls,
        usersIds: [userInfo.userId],
        users: [
          {
            hashedId: hashedUserId,
            fullName: userNameAndProfile.fullName,
            profileImg: userNameAndProfile.profileImg,
            locationApproved: false,
          },
        ],
        info: data.info,
        location: data.location,
        locName: data.locName,
        time: data.time,
        status: 'gathering initiated',
      });
      return createdGathering.save();
    } else {
      const createdLocation = new this.gatheringsModel({
        imgsBefore: uploadedImgsUrls,
        info: data.info,
        location: data.location,
        locName: data.locName,
        status: 'location found',
      });
      return createdLocation.save();
    }
  }

  async getAll(req, type: 'locations' | 'gatherings' | 'closedGatherings') {
    let allTypeObjects;

    switch (type) {
      case 'locations':
        allTypeObjects = await this.gatheringsModel.find(
          {
            users: { $size: 0 },
          },
          { usersIds: 0 },
        );
        break;
      case 'gatherings':
        allTypeObjects = await this.gatheringsModel.find(
          {
            'users.0': { $exists: true },
          },
          { usersIds: 0 },
        );
        break;
      case 'closedGatherings':
        const userInfo = await this.authService.decodeToken(req);
        if (userInfo.role !== 'admin')
          throw new HttpException(
            'unauthorized, access denied!',
            HttpStatus.UNAUTHORIZED,
          );
        allTypeObjects = await this.gatheringsModel.find(
          {
            status: { $eq: 'pending approval' },
          },
          { usersIds: 0 },
        );
        break;
    }

    if (!allTypeObjects)
      throw new HttpException('wrong parameter!', HttpStatus.BAD_REQUEST);

    return allTypeObjects;
  }

  async addUserToGathering(req, data) {
    console.log(new Date(data.time) <= new Date());
    const userInfo = await this.authService.decodeToken(req);
    const resultGathering = await this.gatheringsModel.findById(
      data.gatheringId,
    );

    if (!resultGathering)
      throw new HttpException('gathering not found!', HttpStatus.BAD_REQUEST);

    resultGathering.usersIds.forEach((userId) => {
      if (userId === userInfo.userId) {
        throw new HttpException(
          'user already attending gathering!',
          HttpStatus.CONFLICT,
        );
      }
    });

    if (resultGathering?.users.length === 0 && !data?.time)
      throw new HttpException(
        'time must be provided in gathering init',
        HttpStatus.BAD_REQUEST,
      );

    if (new Date(data.time) <= new Date())
      throw new HttpException('invalid date!', HttpStatus.BAD_REQUEST);

    const userNameAndProfile =
      await this.usersService.getUserNameAndProfileById(userInfo.userId);
    const hashedUserId = await bcrypt.hash(userInfo.userId, 10);

    resultGathering.users.push({
      hashedId: hashedUserId,
      fullName: userNameAndProfile.fullName,
      profileImg: userNameAndProfile.profileImg,
      isLocApproved: false,
    });

    resultGathering.usersIds.push(userInfo.userId);

    if (resultGathering.users.length === 1) {
      resultGathering.time = data.time;
      resultGathering.status = 'gathering initiated';
    }

    const updatedGathering = resultGathering.save();
    return updatedGathering;
  }

  async removeUserFromGathering(req, gatheringId) {
    const userInfo = await this.authService.decodeToken(req);
    const resultGathering = await this.gatheringsModel.findById(gatheringId);

    if (!resultGathering)
      throw new HttpException('gathering not found!', HttpStatus.BAD_REQUEST);

    const userIdIndex = resultGathering.usersIds.findIndex(
      (userId) => userId === userInfo.userId,
    );

    if (userIdIndex === -1)
      throw new HttpException('user not in gathering!', HttpStatus.CONFLICT);

    const userIndex = resultGathering.users.findIndex(async (user) => {
      await bcrypt.compare(userInfo.userId, user.hashedId);
    });

    resultGathering.users.splice(userIndex, 1);
    resultGathering.usersIds.splice(userIdIndex, 1);

    if (resultGathering.users.length === 0) {
      resultGathering.status = 'location found';
      resultGathering.time = null;
    }

    const updatedGathering = await resultGathering.save();
    return updatedGathering;
  }

  async checkUserGatheringRole(
    req,
    gatheringId,
  ): Promise<'host' | 'attendee' | 'viewer'> {
    const userInfo = await this.authService.decodeToken(req);
    const resultGathering = await this.gatheringsModel.findById(gatheringId);

    if (!resultGathering)
      throw new HttpException('gathering not found!', HttpStatus.BAD_REQUEST);

    const userIndex = resultGathering.users.findIndex(
      async (obj) => await bcrypt.compare(userInfo.userId, obj.hashedId),
    );

    switch (true) {
      case userIndex === 0:
        return 'host';
      case userIndex >= 1:
        return 'attendee';
      case userIndex === -1:
        return 'viewer';
    }
  }

  async closeGathering(data, req, images) {
    if (!images)
      throw new HttpException(
        'no images were provided!',
        HttpStatus.BAD_REQUEST,
      );

    const userGatheringRole = await this.checkUserGatheringRole(
      req,
      data.gatheringId,
    );
    if (userGatheringRole !== 'host')
      throw new HttpException('premission denied!', HttpStatus.UNAUTHORIZED);

    const resultGathering = await this.gatheringsModel.findById(
      data.gatheringId,
    );
    if (resultGathering?.status === 'pending approval')
      throw new HttpException(
        'gathering already closed!',
        HttpStatus.BAD_REQUEST,
      );

    const uploadedImagesUrls = await this.cloudinaryService.uploadImages(
      images,
      'greencare_cleaned_locations',
    );
    resultGathering.imgsAfter = uploadedImagesUrls;
    resultGathering.status = 'pending approval';
    const updatedGathering = resultGathering.save();
    return updatedGathering;
  }

  async approveUserLocation(req, gatheringId) {
    const userInfo = await this.authService.decodeToken(req);
    const resultGathering = await this.gatheringsModel.findById(gatheringId);

    if (!resultGathering)
      throw new HttpException('gathering not found!', HttpStatus.BAD_REQUEST);

    const userIndex = resultGathering.users.findIndex(
      async (obj) => await bcrypt.compare(userInfo.userId, obj.hashedId),
    );

    if (userIndex === -1)
      throw new HttpException('user not in gathering!', HttpStatus.CONFLICT);

    resultGathering.users[userIndex].isLocApproved = true;
    const updatedGathering = await resultGathering.save();
    return updatedGathering;
  }

  async updateGatheringStatus(req, data, newStatus: 'approved' | 'denied') {
    const userInfo = await this.authService.decodeToken(req);
    if (userInfo.role !== 'admin')
      throw new HttpException(
        'unauthorized, access denied!',
        HttpStatus.UNAUTHORIZED,
      );
    const resultGathering = await this.gatheringsModel.findById(
      data.gatheringId,
    );
    if (!resultGathering)
      throw new HttpException('gathering not found!', HttpStatus.BAD_REQUEST);
    if (resultGathering.status === newStatus)
      throw new HttpException('no status update needed!', HttpStatus.CONFLICT);
    resultGathering.status = newStatus;
    const updatedGathering = await resultGathering.save();
    return updatedGathering;
  }
}
