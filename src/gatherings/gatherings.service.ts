import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { Gatherings, GatheringsDocument } from 'src/schemas/gatherings.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GatheringsService {
  constructor(
    @InjectModel(Gatherings.name)
    private readonly gatheringsModel: Model<GatheringsDocument>,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async addLocationOrGathering(req, data) {
    const userInfo = await this.authService.decodeToken(req);

    if (data.time && new Date(data.time) <= new Date())
      throw new HttpException('invalid date provided!', HttpStatus.BAD_REQUEST);

    const user = await this.usersService.findUserById(userInfo.userId);

    const action = {
      name: data.locName,
      action: '',
      img: data.imgsBefore[0],
      time: new Date(),
    };

    if (data.time) {
      // const hashedUserId = await bcrypt.hash(userInfo.userId, 10);
      const createdGathering = new this.gatheringsModel({
        imgsBefore: data.images,
        usersIds: [{ id: userInfo.userId, isLocApproved: false }],
        users: [
          {
            // hashedId: hashedUserId,
            fullName: user.fullName,
            profileImg: user.profileImg,
          },
        ],
        info: data.info,
        location: data.location,
        locName: data.locName,
        time: data.time,
        capacity: data?.capacity ?? 8,
        status: 'gathering initiated',
      });
      action.action = 'you have initiated a gathering';
      user.actions.push(action);
      return Promise.all([createdGathering.save(), user.save()]);
    } else {
      const createdLocation = new this.gatheringsModel({
        imgsBefore: data.imgsBefore,
        info: data.info,
        location: data.location,
        locName: data.locName,
        status: 'location found',
      });
      action.action = 'you have reported a location';
      user.actions.push(action);
      return Promise.all([createdLocation.save(), user.save()]);
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
    const userInfo = await this.authService.decodeToken(req);
    const resultGathering = await this.gatheringsModel.findById(
      data.gatheringId,
    );

    if (!resultGathering)
      throw new HttpException('gathering not found!', HttpStatus.BAD_REQUEST);

    const date = new Date();
    if (
      resultGathering?.users.length === 0 &&
      (!data?.time || date.setTime(data.time) <= date.getDate())
    )
      throw new HttpException(
        'valid date must be provided in gathering init',
        HttpStatus.BAD_REQUEST,
      );

    resultGathering.usersIds.forEach((obj) => {
      if (obj.id === userInfo.userId) {
        throw new HttpException(
          'user already attending gathering!',
          HttpStatus.CONFLICT,
        );
      }
    });

    const user = await this.usersService.findUserById(userInfo.userId);
    //const hashedUserId = await bcrypt.hash(userInfo.userId, 10);

    const action = {
      name: resultGathering.locName,
      action: '',
      img: resultGathering.imgsBefore[0],
      time: new Date(),
    };

    resultGathering.users.push({
      //hashedId: hashedUserId,
      fullName: user.fullName,
      profileImg: user.profileImg,
    });

    resultGathering.usersIds.push({
      id: userInfo.userId,
      isLocApproved: false,
    });

    if (resultGathering.users.length === 1) {
      resultGathering.time = data.time;
      resultGathering.status = 'gathering initiated';
      action.action = 'you have initiated a gathering';
    } else {
      action.action = 'you joined a gathering';
    }

    user.actions.push(action);
    return Promise.all([resultGathering.save(), user.save()]);
  }

  async removeUserFromGathering(req, gatheringId) {
    const userInfo = await this.authService.decodeToken(req);
    const resultGathering = await this.gatheringsModel.findById(gatheringId);

    if (!resultGathering)
      throw new HttpException('gathering not found!', HttpStatus.BAD_REQUEST);

    const user = await this.usersService.findUserById(userInfo.userId);
    const action = {
      name: resultGathering.locName,
      action: 'you have left this gathering',
      img: resultGathering.imgsBefore[0],
      time: new Date(),
    };

    const userIdIndex = resultGathering.usersIds.findIndex(
      (obj) => obj.id === userInfo.userId,
    );

    if (userIdIndex === -1)
      throw new HttpException('user not in gathering!', HttpStatus.CONFLICT);

    resultGathering.users.splice(userIdIndex, 1);
    resultGathering.usersIds.splice(userIdIndex, 1);

    if (resultGathering.users.length === 0) {
      resultGathering.status = 'location found';
      resultGathering.time = null;
    }

    const newHost = resultGathering.usersIds[0].id
      ? await this.usersService.findUserById(resultGathering.usersIds[0].id)
      : null;
    const newHostAction = newHost
      ? {
          name: resultGathering.locName,
          action: 'you are now the host of this gathering',
          img: resultGathering.imgsBefore[0],
          time: new Date(),
        }
      : null;

    user.actions.push(action);
    if (newHostAction) {
      newHost.actions.push(newHostAction);
      return Promise.all([resultGathering.save(), user.save(), newHost.save()]);
    }
    return Promise.all([resultGathering.save(), user.save()]);
  }

  async checkUserGatheringRole(
    req,
    gatheringId,
  ): Promise<'host' | 'attendee' | 'viewer'> {
    const userInfo = await this.authService.decodeToken(req);
    const resultGathering = await this.gatheringsModel.findById(gatheringId);

    if (!resultGathering)
      throw new HttpException('gathering not found!', HttpStatus.BAD_REQUEST);

    const userIdIndex = resultGathering.usersIds.findIndex((obj) => {
      return obj.id === userInfo.userId;
    });

    switch (true) {
      case userIdIndex === 0:
        return 'host';
      case userIdIndex >= 1:
        return 'attendee';
      case userIdIndex === -1:
        return 'viewer';
    }
  }

  async closeGathering(data, req) {
    if (!data.imgsAfter || !data.imgsAfter.length)
      throw new HttpException(
        'images were not provided!',
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

    resultGathering.imgsAfter = data.imgsAfter;
    resultGathering.status = 'pending approval';

    const action = {
      name: resultGathering.locName,
      action: 'gathering has been closed',
      img: resultGathering.imgsBefore[0],
      time: new Date(),
    };
    const updatedUsers = await this.usersService.addActionToApprovedUsers(
      action,
      resultGathering.usersIds,
    );
    if (!updatedUsers)
      throw new HttpException(
        'something went wrong!',
        HttpStatus.EXPECTATION_FAILED,
      );
    const updatedGathering = resultGathering.save();
    return updatedGathering;
  }

  async approveUserLocation(req, gatheringId) {
    const userInfo = await this.authService.decodeToken(req);
    const resultGathering = await this.gatheringsModel.findById(gatheringId);

    if (!resultGathering)
      throw new HttpException('gathering not found!', HttpStatus.BAD_REQUEST);

    const userIndex = resultGathering.usersIds.findIndex((obj) => {
      return obj.id === userInfo.userId;
    });

    if (userIndex === -1)
      throw new HttpException('user not in gathering!', HttpStatus.CONFLICT);

    resultGathering.usersIds[userIndex].isLocApproved = true;
    resultGathering.markModified('usersIds');
    const updatedGathering = await resultGathering.save();
    return updatedGathering;
  }

  async updateGatheringStatus(req, data, newStatus: 'approved' | 'denied') {
    const userInfo = await this.authService.decodeToken(req);
    const promises = [];
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

    if (newStatus === 'approved') {
      resultGathering.usersIds.forEach((obj, index) => {
        if (obj.isLocApproved)
          promises.push(
            new Promise((res, rej) => {
              res(this.usersService.giveCoins(obj.id, index));
            }),
          );
      });
    }
    return Promise.all(promises).then(async () => {
      const updatedGathering = await resultGathering.save();
      return updatedGathering;
    });
  }
}
