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
    return plans.slice(0, toKeep);
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
      (plans.length * survivorProportion) / 100,
    );

    // le reste peut se reproduire
    const newPlans = [];
    for (let i = 0; i < nbReproductions; i++) {
      const father = this.rouletteWheelSelection(survivors)?.clone();

      if (father) {
        const child = Plan.createFromOneParent(father);

        const willMutate = Math.random() < probMutation / 100;
        if (willMutate) {
          // on mute et on ajoute à la population => 2 nouveaux plans
          const mutatedChild = this.mutate(child);
          if (mutatedChild) newPlans.push(mutatedChild);
        }

        newPlans.push(child);
      }
    }
    // après toutes les reproductions, on ajoute les plans existants à la population
    const nextPlansGeneration = this.sortPlans([...survivors, ...newPlans]);

    return nextPlansGeneration;
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
      group1Seat.col === group2Seat.col &&
      group1Seat.line === group2Seat.line
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
