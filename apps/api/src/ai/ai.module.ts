import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PhotographersModule } from '../photographers/photographers.module';
import { BookingsModule } from '../bookings/bookings.module';
import { GalleriesModule } from '../galleries/galleries.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    PhotographersModule,
    BookingsModule,
    GalleriesModule,
    SubscriptionsModule,
    ClientsModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
