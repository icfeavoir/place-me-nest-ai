import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EventsModule } from './events/events.module';
import { GAService } from './services/ga.service';

@Module({
  imports: [EventsModule],
  controllers: [AppController],
  providers: [GAService],
})
export class AppModule {}
