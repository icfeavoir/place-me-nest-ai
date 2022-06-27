import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';
import { GroupDto } from 'src/types/dto';
import {
  ConstraintSeatsType,
  GridSizeType,
  ScoreType,
  SeatType,
} from 'src/types/types';

export class GenerateRequestDto {
  @IsArray()
  groups: GroupDto[];

  @IsArray()
  constraints: ConstraintSeatsType[];

  @IsNotEmpty()
  gridSize: GridSizeType;

  @IsNotEmpty()
  scores: ScoreType;

  @IsArray()
  forbiddenSeats: SeatType[];

  @IsNumber()
  nbPlans: number;

  @IsNumber()
  survivorProportion: number;

  @IsNumber()
  nbReproductions: number;

  @IsNumber()
  probaMutation: number;

  @IsNumber()
  nbGenerations: number;
}
