import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { GAService } from './services/ga.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [GAService],
})
export class AppModule {}
