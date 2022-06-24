import { Plan } from '../models/Plan';
import { ConstraintSeatsType, GridSizeType, SeatType } from './types';

export type GenerateDTO = {
  bestPlan: Plan;
  bestScore: number;
  averageScore: number;
  time: number;
};

export type GroupDto = {
  name: string;
  nb: number;
  // groupConstraint: string;
};

export type GenerateRequestDto = {
  groups: GroupDto[];
  constraints: ConstraintSeatsType[];
  gridSize: GridSizeType;
  forbiddenSeats: SeatType[];
  nbPlans: number;
  survivorProportion: number;
  nbReproductions: number;
  probaMutation: number;
  nbGenerations: number;
};
