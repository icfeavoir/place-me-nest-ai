import { Body, Controller, Get, Post } from '@nestjs/common';
import { Group } from './models/Group';
import { Plan } from './models/Plan';
import { GAService } from './services/ga.service';
import { GenerateDTO, GenerateRequestDto } from './types/dto';

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
      nbPlans,
      nbGenerations,
      nbReproductions,
      probaMutation,
      survivorProportion,
    }: GenerateRequestDto,
  ): GenerateDTO | null {
    const generatedGroups: Group[] = groups.map(
      (group) => new Group(group?.name, group?.nb),
    );

    let plans: Plan[] = this.gaService.initializePopulation(
      gridSize,
      generatedGroups,
      nbPlans,
      forbiddenSeats,
      constraints,
    );

    // mesure time
    const begin = new Date();
    let bestPlan = plans[0];

    for (let i = 0; i < nbGenerations; i++) {
      plans = this.gaService.reproduce(
        plans,
        survivorProportion,
        nbReproductions,
        probaMutation,
      );
      bestPlan = plans[0];
    }

    const end = new Date();
    const timeInSeconds = (end.getTime() - begin.getTime()) / 1000;

    return {
      bestScore: bestPlan.score,
      averageScore: plans.reduce(
        (avg, value, _, { length }) => avg + value?.score / length,
        0,
      ),
      time: timeInSeconds,
      bestPlan,
    };
  }
}
