import { Injectable } from '@nestjs/common';
import { Group } from 'src/models/Group';
import {
  ConstraintSeatsType,
  GridSizeType,
  ScoreType,
  SeatType,
} from 'src/types/types';
import { Plan } from '../models/Plan';

@Injectable()
export class GAService {
  sortPlans(plans: Plan[]) {
    return plans.sort((a, b) => b.score - a.score);
  }

  keepOnly(plans: Plan[], toKeep: number) {
    if (toKeep < 1) toKeep = 1;
    return plans.slice(0, toKeep);
  }

  private sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Main function
   * Boucle sur le nb de générations
   */
  async startGenerating(
    plans: Plan[],
    nbGenerations: number,
    survivorProportion: number,
    nbReproductions: number,
    probaMutation: number,
    emit: (event: string, data: any) => void,
  ) {
    // mesure time
    const begin = new Date();
    let bestPlan = plans[0];
    let error = null;
    // Mesure convergence
    const genOfBestPlan = { generation: 0, score: 0 };

    try {
      const genArray = Array.from({ length: nbGenerations }, (v, i) => i);
      for (const i of genArray) {
        plans = this.reproduce(
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

        emit('loading', { current: i, total: nbGenerations });

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
          emit('current-gen', currentGen);
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

    emit('done', result);
  }

  /**
   * Création de la première population
   */
  initializePopulation(
    gridSize: GridSizeType,
    groups: Group[],
    nbPlans: number,
    forbiddenSeats: SeatType[],
    constraints: ConstraintSeatsType[],
    scores: ScoreType,
  ): Plan[] {
    const plans = Array.from(
      { length: nbPlans },
      () => new Plan(gridSize, groups, forbiddenSeats, constraints, scores),
    );

    return plans.map((plan) => {
      plan.generateRandomPlan();
      return plan;
    });
  }

  /**
   * Création de nouveaux plans à partir des plans existants
   */
  reproduce(
    plans: Plan[],
    survivorProportion: number,
    nbReproductions: number,
    probMutation: number,
  ) {
    // on "tue" une partie de la population
    const bestPlans = this.sortPlans(plans);
    const survivors = this.keepOnly(
      bestPlans,
      plans.length * (survivorProportion / 100),
    );

    // le reste peut se reproduire
    const newPlans = [];
    for (let i = 0; i < nbReproductions; i++) {
      const father = this.rouletteWheelSelection(survivors)?.clone();
      const mother = this.rouletteWheelSelection(survivors)?.clone();

      if (father && mother) {
        const child = Plan.createFromOneParent(father);
        // const child = Plan.createFromParents(father, mother);

        const willMutate = Math.random() < probMutation / 100;
        if (willMutate) {
          // on mute et on ajoute à la population => 2 nouveaux plans
          const mutatedChild = this.mutate(child);
          if (mutatedChild) newPlans.push(mutatedChild);
        } else {
          newPlans.push(child);
        }
      }
    }
    // après toutes les reproductions, on ajoute les plans existants à la population
    const nextPlansGeneration = this.sortPlans([...survivors, ...newPlans]);

    return nextPlansGeneration;
  }

  /**
   * Technique de sélection de plan.
   * Chaque plan de la liste peut être choisi, mais plus son score est bon,
   * plus sa prob d'être choisie est grande.
   */
  private rouletteWheelSelection(plans: Plan[]): Plan {
    const sortedPlans = this.sortPlans(plans);

    // par défaut, on choisit le premier plan
    let selectedPlan: Plan = sortedPlans[0];

    const sumScore = sortedPlans.reduce((acc, plan) => acc + plan.score, 0);
    const choosedScore = Math.floor(Math.random() * sumScore);

    let scoreCounter = 0;
    sortedPlans.every((plan) => {
      scoreCounter += plan.score;
      // retourne une copie
      if (scoreCounter >= choosedScore) {
        selectedPlan = plan;
        // every doit retourner false pour arrêter la boucle
        return false;
      }
      return true;
    });

    return selectedPlan;
  }

  /**
   * Mutation d'un plan (échange de 2 personnes)
   * @param plan
   * @returns
   */
  mutate(plan: Plan): Plan | null {
    const newPlan = plan.clone();

    const randomGroup1 = newPlan.getRandomGroup();
    const group1Seats = newPlan.getGroupSeats(randomGroup1);
    const group1Seat =
      group1Seats[Math.floor(Math.random() * group1Seats.length)];
    const group1Member = newPlan.getGroupMemberAt(group1Seat);

    // Idem pour group2
    const randomGroup2 = newPlan.getRandomGroup();
    const group2Seats = newPlan.getGroupSeats(randomGroup2);
    const group2Seat =
      group2Seats[Math.floor(Math.random() * group2Seats.length)];
    const group2Member = newPlan.getGroupMemberAt(group2Seat);

    // Si les 2 sièges sont le même, on annule la mutation
    if (
      group1Seat?.col === group2Seat?.col &&
      group1Seat?.line === group2Seat?.line
    )
      return null;

    // On vide les sièges
    newPlan.emptySeat(group1Seat);
    newPlan.emptySeat(group2Seat);

    // On remplit
    newPlan.setGroupMemberAt(group1Seat, group2Member);
    newPlan.setGroupMemberAt(group2Seat, group1Member);

    newPlan.calculateScore();

    return newPlan;
  }
}
