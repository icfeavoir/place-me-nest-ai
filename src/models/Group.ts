import { COLORS } from "../types/colors";
import { GroupConstraintType, GroupMemberType } from "../types/types";

export class Group {
  private _name: string;
  private _nb: number;
  private _color: string;
  private _groupConstraint: GroupConstraintType | null;
  private _members: GroupMemberType[] = [];
  
  constructor(name: string, nb: number, groupConstraint: GroupConstraintType | null = null) {
    this._name = name;
    this._nb = nb;
    this._color = this.getRandomColor();
    this._groupConstraint = groupConstraint;

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
    return this._groupConstraint;
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
   * Définit une couleur pour le groupe
   * @returns 
   */
  private getRandomColor(): string {
    const randomIndex = Math.floor(Math.random() * COLORS.length);
    return COLORS[randomIndex];
  }

  /**
   * Génère les membres du groupe
   * - Affecte un numéro à chacun
   * - Affecte une contrainte spécifique à chacun (selon le nb ayant cette contrainte)
   */
  private generateMembers(): void {
    for (let i = 0; i < this._nb; i++) {
      // Si x personnes ont la contrainte, on donne aux x premiers
      const memberHasConstraint = this._groupConstraint && this._groupConstraint?.nb > i;
      const member: GroupMemberType = {
        groupName: this._name,
        groupColor: this._color,
        groupNb: this._nb,
        nb: i,
        constraint: memberHasConstraint ? (this._groupConstraint?.constraint ?? null) : null,
      }

      this._members.push(member);
    }
  }
}