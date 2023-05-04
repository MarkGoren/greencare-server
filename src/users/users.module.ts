import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminsModule } from 'src/admins/admins.module';
import { AdminsService } from 'src/admins/admins.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { LocalStrategy } from 'src/auth/local.strategy';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CryptoModule } from 'src/crypto/crypto.module';
import { CryptoService } from 'src/crypto/crypto.service';
import { Admins, AdminsSchema } from 'src/schemas/admins.schema';
import { Users, UsersSchema } from 'src/schemas/users.schema';
import { SendgridModule } from 'src/sendgrid/sendgrid.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Users.name, schema: UsersSchema },
      { name: Admins.name, schema: AdminsSchema },
    ]),
    AdminsModule,
    SendgridModule,
    JwtModule,
    CloudinaryModule,
    CryptoModule,
  ],
  providers: [
    UsersService,
    LocalStrategy,
    JwtStrategy,
    AuthService,
    AdminsService,
    AuthService,
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
