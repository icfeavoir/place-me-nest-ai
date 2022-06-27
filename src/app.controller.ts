import { Body, Controller, Post } from '@nestjs/common';
import { GenerateRequestDto } from './dto/GenerateRequestDto';
import { Group } from './models/Group';
import { Plan } from './models/Plan';
import { GAService } from './services/ga.service';
import { GenerateDTO } from './types/dto';

@Controller('/generate')
export class AppController {
  constructor(private readonly gaService: GAService) {}

  @Post()
  generate(
    @Body()
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
  ): GenerateDTO {
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

    try {
      for (let i = 0; i < nbGenerations; i++) {
        console.log('GENERATION ', i);
        plans = this.gaService.reproduce(
          plans,
          survivorProportion,
          nbReproductions,
          probaMutation,
        );
        bestPlan = plans[0];
      }
    } catch (e) {
      error = e.message;
    }

    const end = new Date();
    const timeInSeconds = (end.getTime() - begin.getTime()) / 1000;

    return {
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
  }
}
