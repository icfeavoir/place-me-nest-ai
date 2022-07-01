import { GroupConstraintType, GroupMemberType } from '../types/types';

export class Group {
  private _name: string;
  private _nb: number;
  private _color: string;
  private _constraint: GroupConstraintType | null;
  private _members: GroupMemberType[] = [];

  constructor(
    name: string,
    nb: number,
    color: string,
    constraint: GroupConstraintType | null = null,
  ) {
    this._name = name;
    this._nb = nb;
    this._color = color;
    this._constraint = constraint;

    this.generateMembers();
  }

  get name(): string {
    return this._name;
  }

  get nb(): number {
    return this._nb;
  }

  get color(): string {
    return this._color;
  }

  get constraint(): GroupConstraintType | null {
    return this._constraint;
  }

  get members(): GroupMemberType[] {
    return this._members;
  }

  /**
   * Retourne un membre spécifique du groupe
   * @param i Numéro du membre
   * @returns {GroupMemberType}
   */
  getMemberNumber(i: number): GroupMemberType | null {
    return this._members[i] ?? null;
  }

  /**
   * Génère les membres du groupe
   * - Affecte un numéro à chacun
   * - Affecte une contrainte spécifique à chacun (selon le nb ayant cette contrainte)
   */
  private generateMembers(): void {
    for (let i = 0; i < this._nb; i++) {
      // Si x personnes ont la contrainte, on donne aux x premiers
      const memberHasConstraint = this._constraint && this._constraint?.nb > i;
      const member: GroupMemberType = {
        groupName: this._name,
        groupColor: this._color,
        groupNb: this._nb,
        nb: i,
        constraintName: memberHasConstraint
          ? this._constraint.constraintName
          : null,
      };

      this._members.push(member);
    }
  }
}
