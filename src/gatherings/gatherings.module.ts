import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminsModule } from 'src/admins/admins.module';
import { AdminsService } from 'src/admins/admins.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Admins, AdminsSchema } from 'src/schemas/admins.schema';
import { Gatherings, GatheringsSchema } from 'src/schemas/gatherings.schema';
import { Users, UsersSchema } from 'src/schemas/users.schema';
import { UsersModule } from 'src/users/users.module';
import { GatheringsController } from './gatherings.controller';
import { GatheringsService } from './gatherings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gatherings.name, schema: GatheringsSchema },
      { name: Admins.name, schema: AdminsSchema },
      { name: Users.name, schema: UsersSchema },
    ]),
    UsersModule,
    AdminsModule,
    JwtModule,
  ],
  providers: [
    GatheringsService,
    AuthService,
    AdminsService,
    JwtStrategy,
    CloudinaryService,
  ],
  controllers: [GatheringsController],
  exports: [GatheringsService],
})
export class GatheringsModule {}
