import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CryptoService } from 'src/crypto/crypto.service';
import { Admins, AdminsSchema } from 'src/schemas/admins.schema';
import { Users, UsersSchema } from 'src/schemas/users.schema';
import { UsersService } from 'src/users/users.service';
import { SendgridService } from './sendgrid.service';

@Module({
  providers: [SendgridService, UsersService, CryptoService],
  controllers: [],
  exports: [SendgridService],
  imports: [
    MongooseModule.forFeature([
      { name: Users.name, schema: UsersSchema },
      { name: Admins.name, schema: AdminsSchema },
    ]),
    CloudinaryModule,
  ],
})
export class SendgridModule {}
