import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('enrollments')
@Controller('students/:studentId/enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get student enrollment list' })
  getByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.enrollmentsService.getByStudent(studentId);
  }

  @Put()
  @ApiOperation({
    summary:
      'Replace student enrollment selection (max 3 subjects, no repeated professor)',
  })
  updateByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.updateByStudent(
      studentId,
      updateEnrollmentDto,
    );
  }
}
