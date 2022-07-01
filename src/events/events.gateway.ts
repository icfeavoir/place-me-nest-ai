import {
  MessageBody,
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

  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const generatedGroups: Group[] = groups.map(
      (group) =>
        new Group(group?.name, group?.nb, group?.color, group?.constraint),
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
    // Mesure convergence
    const genOfBestPlan = { generation: 0, score: 0 };

    try {
      const genArray = Array.from({ length: nbGenerations }, (v, i) => i);
      for (const i of genArray) {
        plans = this.gaService.reproduce(
          plans,
          survivorProportion,
          nbReproductions,
          probaMutation,
        );
        bestPlan = plans[0];

        if (bestPlan.score > genOfBestPlan.score) {
          genOfBestPlan.generation = i;
          genOfBestPlan.score = bestPlan.score;
        }

        this.server.emit('loading', { current: i, total: nbGenerations });

        // emit toutes les 10 gen
        if (i % 10 === 0) {
          const currentGen = {
            genOfBestPlan,
            bestPlan: {
              gridSize: bestPlan.gridSize,
              placement: bestPlan.placement,
              forbiddenSeats: bestPlan.forbiddenSeats,
              score: bestPlan.score,
            },
          };
          this.server.emit('current-gen', currentGen);
        }

        // Sleep 0 to let time to send socket
        await this.sleep(0);
      }
    } catch (e) {
      console.error(e);
      error = e.message;
    }

    const end = new Date();
    const timeInSeconds = (end.getTime() - begin.getTime()) / 1000;

    const result = {
      genOfBestPlan,
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

    this.server.emit('done', result);
  }
}
