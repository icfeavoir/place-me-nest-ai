import {
  ConstraintSeatsType,
  GridSizeType,
  GroupMemberType,
  SeatType,
} from './types';

export type PlanResponseDTO = {
  placement: GroupMemberType[];
  gridSize: GridSizeType;
  score: number;
};

export type GenerateDTO = {
  bestPlan: PlanResponseDTO;
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
