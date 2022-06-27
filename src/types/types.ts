export type GridSizeType = {
  width: number;
  height: number;
};

export type GroupMemberType = {
  groupName: string; // nom du groupe
  groupColor: string; // couleur du groupe
  groupNb: number; // nombre de personnes dans le groupe
  nb: number; // numero dans le groupe
  constraintName: string | null; // contrainte spécifique de ce membre
  seat?: SeatType;
};

export type SeatType = {
  line: number;
  col: number;
};

export type ConstraintSeatsType = {
  name: string;
  seats: SeatType[];
};

export type GroupConstraintType = {
  constraintName: string;
  nb: number;
};

export type ScoreType = {
  leftRightScore: number;
  topBottomScore: number;
  malusScore: number;
};
