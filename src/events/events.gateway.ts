import {
  MessageBody,
  // eslint-disable-next-line
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Group } from 'src/models/Group';
import { Plan } from 'src/models/Plan';
import { GAService } from 'src/services/ga.service';
import { GenerateRequestDto } from 'src/types/dto';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class EventsGateway {
  constructor(private readonly gaService: GAService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('generate')
  async generate(
    @MessageBody()
    {
      gridSize,
      groups,
      forbiddenSeats,
      constraints,
      scores,
      nbPlans,
      nbGenerations,
      nbReproductions,
      probaMutation,
      survivorProportion,
    }: GenerateRequestDto,
  ) {
    // Mise en forme des données
    const generatedGroups: Group[] = groups.map(
      (group) =>
        new Group(group?.name, group?.nb, group?.color, group?.constraint),
    );

    // Génération 0
    const plans: Plan[] = this.gaService.initializePopulation(
      gridSize,
      generatedGroups,
      nbPlans,
      forbiddenSeats,
      constraints,
      scores,
    );

    const emitter = (event: string, data: any) => {
      this.server.emit(event, data);
    };

    this.gaService.startGenerating(
      plans,
      nbGenerations,
      survivorProportion,
      nbReproductions,
      probaMutation,
      emitter,
    );
  }
}
