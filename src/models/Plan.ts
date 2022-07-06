import {
  SeatType,
  GridSizeType,
  GroupMemberType,
  ConstraintSeatsType,
  ScoreType,
} from '../types/types';
import { Group } from './Group';

export class Plan {
  private _placement: GroupMemberType[];
  private _score: number;

  private _gridSize: GridSizeType;
  private _groups: Group[];
  private _forbiddenSeats: SeatType[];
  private _constraints: ConstraintSeatsType[];
  private _scorePoints: ScoreType;

  constructor(
    gridSize: GridSizeType,
    groups: Group[],
    forbiddenSeats: SeatType[],
    constraints: ConstraintSeatsType[],
    scoresPoints: ScoreType,
  ) {
    this._groups = groups;
    this._gridSize = gridSize;
    this._forbiddenSeats = forbiddenSeats;
    this._constraints = constraints;
    this._scorePoints = scoresPoints;

    this._placement = [];
    this._score = 0;

    this.calculateScore();
  }

  get width(): number {
    return this._gridSize.width;
  }

  get height(): number {
    return this._gridSize.height;
  }

  get gridSize(): GridSizeType {
    return this._gridSize;
  }

  get placement(): GroupMemberType[] {
    return this._placement;
  }

  get groups(): Group[] {
    return this._groups;
  }

  get score(): number {
    return this._score;
  }

  get forbiddenSeats(): SeatType[] {
    return this._forbiddenSeats;
  }

  getGroupMemberAt(seat: SeatType): GroupMemberType | null {
    return this._placement.find(
      ({ seat: groupMemberSeat }) =>
        groupMemberSeat.line === seat.line && groupMemberSeat.col === seat.col,
    );
  }

  /**
   * Retourne tous les sièges occupés par un groupe
   * @param group
   */
  getGroupSeats(group: Group): SeatType[] {
    return this._placement
      .filter(({ groupName }) => groupName === group.name)
      .map(({ seat }) => seat);
  }

  isSeatAvailable(seat: SeatType): boolean {
    return this.getGroupMemberAt(seat) === null;
  }

  isSeatTaken(seat: SeatType): boolean {
    return !this.isSeatAvailable(seat);
  }

  /**
   * Place un groupe member sur un siège
   * @param seat
   * @param groupMember
   */
  setGroupMemberAt(seat: SeatType, groupMember: GroupMemberType | null) {
    if (this.isForbiddenSeatAt(seat.line, seat.col)) {
      throw new Error(`Seat at line ${seat.line} col ${seat.col} is forbidden`);
    }

    const alreadyTaken = this.getGroupMemberAt(seat);
    // on ne peut pas écraser
    if (alreadyTaken) {
      throw new Error(
        `Seat at line ${seat.line} col ${seat.col} is already taken by ${alreadyTaken.groupName}`,
      );
    }

    this._placement.push({ ...groupMember, seat });
  }

  /**
   * Vide le siège
   * @param seat
   */
  emptySeat(seat: SeatType) {
    const index = this._placement.findIndex(
      ({ seat: groupMemberSeat }) =>
        groupMemberSeat.line === seat.line && groupMemberSeat.col === seat.col,
    );

    if (index >= 0) {
      this._placement.splice(index, 1);
    }
  }

  /**
   * Affecte un groupe à une liste de sièges
   * @param { Group } group
   * @param { SeatType[] } seats
   */
  private setGroupSeats(group: Group, seats: SeatType[]) {
    if (seats.length !== group.members.length) {
      throw new Error(
        `Group ${group.name} has ${group.members.length} members but ${seats.length} seats`,
      );
    }

    seats.forEach((seat, i) =>
      this.setGroupMemberAt(seat, group.getMemberNumber(i)),
    );
  }

  /**
   * Retourne si la place est interdite
   * @param line
   * @param col
   * @returns {boolean}
   */
  isForbiddenSeatAt(line: number, col: number): boolean {
    return this._forbiddenSeats.some(
      ({ line: forbiddenLine, col: forbiddenCol }) => {
        return line === forbiddenLine && col === forbiddenCol;
      },
    );
  }

  /**
   * Place aléatoirement les groupes
   */
  public generateRandomPlan() {
    this.fillMissingGroups(this._groups);
    this.calculateScore();
  }

  /**
   * Place des groupe aléatoirement à des places libres
   * (les groupes sont placés ensemble)
   * @param missingGroups Les groupes qui doivent être placés
   */
  private fillMissingGroups(missingGroups: Group[]) {
    // random line and col
    let line = Math.floor(Math.random() * this._gridSize.height);
    let col = Math.floor(Math.random() * this._gridSize.width);
    let direction: 1 | -1 = Math.random() > 0.5 ? -1 : 1;

    missingGroups.forEach((group) => {
      let remainingGroupMembers = group.nb;
      // on prend les membres un par un
      const groupMember: GroupMemberType | null = group.getMemberNumber(
        remainingGroupMembers - 1,
      );

      let tries = 0;
      while (remainingGroupMembers > 0) {
        try {
          // On place la personne à la place aléatoire
          const seat = { line, col };
          this.setGroupMemberAt(seat, groupMember);
          // On décrémente le nombre de personnes restantes
          remainingGroupMembers--;
          // On remet les essaies à 0
          tries = 0;
        } catch (e) {
          // si la place est interdite, on continue pour placer ensuite
          // Sauf si on a essayé toutes les places
          tries++;
          const nbSeats = this._gridSize.width * this._gridSize.height;
          if (tries > nbSeats) {
            // throw new Error('too many tries: population bigger than Plan');
            break;
          }
        }

        // On décale la colonne dans 1 direction
        col += direction;
        // si on dépasse, on décale la ligne et on change de direction
        const goToLine =
          direction === 1 ? col >= this._gridSize.width : col < 0;

        if (goToLine) {
          direction *= -1;
          // on remet col à 0 ou au bout selon la direciton
          col = direction === 1 ? 0 : this._gridSize.width - 1;
          line++;
        }

        // si on dépasse la hauteur, on recommence
        if (line >= this._gridSize.height) {
          line = 0;
        }
      }
    });
  }

  /**
   * Calcule le score du plan
   */
  calculateScore() {
    let currentScore = 0;

    const LEFT_RIGHT = this._scorePoints.leftRightScore ?? +10;
    const TOP_BOTTOM = this._scorePoints.topBottomScore ?? +7;
    const MALUS = this._scorePoints.malusScore ?? -100;

    this._placement.forEach((groupMember) => {
      const line = groupMember.seat.line;
      const col = groupMember.seat.col;

      const groupMemberRight = this.getGroupMemberAt({ line, col: col + 1 });
      const groupMemberLeft = this.getGroupMemberAt({ line, col: col - 1 });
      const groupMemberTop = this.getGroupMemberAt({ line: line + 1, col });
      const groupMemberBot = this.getGroupMemberAt({ line: line - 1, col });

      let isAlone = true;

      if (groupMemberRight?.groupName === groupMember.groupName) {
        currentScore += LEFT_RIGHT;
        isAlone = false;
      }

      if (groupMemberLeft?.groupName === groupMember.groupName) {
        currentScore += LEFT_RIGHT;
        isAlone = false;
      }

      if (groupMemberTop?.groupName === groupMember.groupName) {
        currentScore += TOP_BOTTOM;
      }

      if (groupMemberBot?.groupName === groupMember.groupName) {
        currentScore += TOP_BOTTOM;
      }

      // Si groupMember seul alors qu'il ne devrait pas => MALUS
      if (isAlone && groupMember.groupNb > 1) {
        currentScore += MALUS;
      }

      // Si groupMember a une contrainte non respectée => MALUS
      if (groupMember?.constraintName) {
        const seats = this._constraints.find(
          (c) => c.name === groupMember.constraintName,
        )?.seats;
        if (
          !seats?.find(
            ({ line: constraintLine, col: constraintCol }) =>
              line === constraintLine && col === constraintCol,
          )
        ) {
          currentScore += MALUS;
        }
      }
    });

    this._score = currentScore;
  }

  clone(): Plan {
    const plan = new Plan(
      this._gridSize,
      this._groups,
      this._forbiddenSeats,
      this._constraints,
      this._scorePoints,
    );
    plan._placement = [...this._placement];
    plan.calculateScore();

    return plan;
  }

  /**
   * Retourne un siège aléatoire
   * @returns {SeatType}
   */
  getRandomSeat(): SeatType {
    const line = Math.floor(Math.random() * this._gridSize.height);
    const col = Math.floor(Math.random() * this._gridSize.width);
    return { line, col };
  }

  /**
   * Retourne un groupe aléatoire
   * @returns {Group}
   */
  getRandomGroup(): Group {
    return this._groups[Math.floor(Math.random() * this._groups.length)];
  }

  /**
   * Création d'un plan à partir d'un seul parent
   * @param father
   * @returns
   */
  static createFromOneParent(father: Plan): Plan {
    const gridSize = {
      width: father.width,
      height: father.height,
    };
    const childPlan = new Plan(
      gridSize,
      father._groups,
      father._forbiddenSeats,
      father._constraints,
      father._scorePoints,
    );

    const groups = [...father._groups];
    let remainingGroups = [...groups];

    groups.forEach((group) => {
      // probabilité d'hériter du père (sinon aléatoire)
      const fatherInheritanceForGroup = Math.random() < 0.5;

      if (fatherInheritanceForGroup) {
        const seats: SeatType[] = father.getGroupSeats(group);
        childPlan.setGroupSeats(group, seats);
        remainingGroups = remainingGroups.filter((g) => g !== group);
        // change parent turn if success
      }
    });

    // put groups that have not been placed
    childPlan.fillMissingGroups(remainingGroups);

    childPlan.calculateScore();

    return childPlan;
  }
}
