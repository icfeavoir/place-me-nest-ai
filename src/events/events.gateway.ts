import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { from, map, Observable } from 'rxjs';
import { Server } from 'socket.io';
import { Group } from 'src/models/Group';
import { Plan } from 'src/models/Plan';
import { GAService } from 'src/services/ga.service';
import { GenerateDTO, GenerateRequestDto } from 'src/types/dto';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class EventsGateway {
  constructor(private readonly gaService: GAService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('generate')
  generate(
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
  ): Observable<WsResponse<string | GenerateDTO>> {
    const generatedGroups: Group[] = groups.map(
      (group) => new Group(group?.name, group?.nb, group?.constraint),
    );

    let plans: Plan[] = this.gaService.initializePopulation(
      gridSize,
      generatedGroups,
      nbPlans,
      forbiddenSeats,
      constraints,
      scores,
    );

    // mesure time
    const begin = new Date();
    let bestPlan = plans[0];
    let error = null;

    return new Observable((subscriber) => {
      try {
        for (let i = 0; i < nbGenerations; i++) {
          // console.log('GENERATION ', i);
          subscriber.next({
            event: 'loading',
            data: `Génération ${i + 1} / ${nbGenerations}`,
          });

          plans = this.gaService.reproduce(
            plans,
            survivorProportion,
            nbReproductions,
            probaMutation,
          );
          bestPlan = plans[0];
        }
      } catch (e) {
        console.error(e);
        error = e.message;
      }

      const end = new Date();
      const timeInSeconds = (end.getTime() - begin.getTime()) / 1000;

      const result = {
        bestScore: bestPlan?.score,
        averageScore: plans.reduce(
          (avg, value, _, { length }) => avg + value?.score / length,
          0,
        ),
        time: timeInSeconds, 
        bestPlan: {
          gridSize: bestPlan.gridSize,
          placement: bestPlan.placement,
          forbiddenSeats: bestPlan.forbiddenSeats,
          score: bestPlan.score,
        },
        error,
      };

      subscriber.next({ event: 'done', data: result });
      subscriber.complete();
    });
  }
}
