import {
  ConstraintSeatsType,
  GridSizeType,
  GroupConstraintType,
  GroupMemberType,
  ScoreType,
  SeatType,
} from './types';

export type PlanResponseDTO = {
  placement: GroupMemberType[];
  gridSize: GridSizeType;
  forbiddenSeats: SeatType[];
  score: number;
};

export type GenerateDTO = {
  bestPlan: PlanResponseDTO;
  bestScore: number;
  averageScore: number;
  time: number;
  error: string | null;
};

export type GroupDto = {
  name: string;
  nb: number;
  constraint: GroupConstraintType;
};

export type GenerateRequestDto = {
  groups: GroupDto[];
  gridSize: GridSizeType;
  forbiddenSeats: SeatType[];
  constraints: ConstraintSeatsType[];
  scores: ScoreType;
  nbPlans: number;
  survivorProportion: number;
  nbReproductions: number;
  probaMutation: number;
  nbGenerations: number;
};
