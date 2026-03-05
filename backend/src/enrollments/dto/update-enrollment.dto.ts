import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateEnrollmentDto {
  @ApiProperty({
    example: [1, 3, 7],
    description:
      'Listado de materias seleccionadas por el estudiante (minimo 1, maximo 3)',
    isArray: true,
    type: Number,
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Debes seleccionar al menos 1 materia',
  })
  @ArrayMaxSize(3)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  subjectIds: number[];
}
