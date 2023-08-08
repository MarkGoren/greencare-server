import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminsModule } from './admins/admins.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatheringsModule } from './gatherings/gatherings.module';
import { PrizesModule } from './prizes/prizes.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_LINK_TEST, {
      connectionFactory: (connection) => {
        connection.useDb('greencareTest');
        return connection;
      },
    }),
    UsersModule,
    AdminsModule,
    GatheringsModule,
    PrizesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppTestModule {}
