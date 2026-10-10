import { Module } from '@nestjs/common';
import { GalleriesController } from './galleries.controller';
import { GalleriesService } from './galleries.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [BookingsModule],
  controllers: [GalleriesController],
  providers: [GalleriesService],
  exports: [GalleriesService],
})
export class GalleriesModule {}
