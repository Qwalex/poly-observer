import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NotifyService } from './notify.service';

@Module({
  imports: [HttpModule],
  providers: [NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}
