import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from 'src/auth/auth.service';
import { Prizes, PrizesSchema } from 'src/schemas/prizes.schema';
import { PrizesController } from './prizes.controller';
import { PrizesService } from './prizes.service';
import { Admins, AdminsSchema } from 'src/schemas/admins.schema';
import { Users, UsersSchema } from 'src/schemas/users.schema';
import { UsersModule } from 'src/users/users.module';
import { AdminsModule } from 'src/admins/admins.module';
import { JwtModule } from '@nestjs/jwt';
import { AdminsService } from 'src/admins/admins.service';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CryptoModule } from 'src/crypto/crypto.module';
import { SendgridModule } from 'src/sendgrid/sendgrid.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prizes.name, schema: PrizesSchema },
      { name: Admins.name, schema: AdminsSchema },
      { name: Users.name, schema: UsersSchema },
    ]),
    UsersModule,
    AdminsModule,
    JwtModule,
    CloudinaryModule,
    CryptoModule,
    SendgridModule,
  ],
  providers: [PrizesService, AdminsService, AuthService, JwtStrategy],
  controllers: [PrizesController],
  exports: [PrizesService],
})
export class PrizesModule {}
