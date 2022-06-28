import { Module } from '@nestjs/common';
import { GAService } from 'src/services/ga.service';
import { EventsGateway } from './events.gateway';

@Module({
  providers: [GAService, EventsGateway],
})
export class EventsModule {}
