import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByStudent(studentId: number) {
    await this.ensureStudentExists(studentId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        subject: {
          include: {
            professor: true,
          },
        },
      },
      orderBy: { subjectId: 'asc' },
    });

    return {
      studentId,
      totalCredits: enrollments.length * 3,
      subjects: enrollments.map((enrollment) => enrollment.subject),
    };
  }

  async updateByStudent(studentId: number, dto: UpdateEnrollmentDto) {
    await this.ensureStudentExists(studentId);
    await this.validateSelectionRules(dto.subjectIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.deleteMany({ where: { studentId } });
      if (dto.subjectIds.length > 0) {
        await tx.enrollment.createMany({
          data: dto.subjectIds.map((subjectId) => ({ studentId, subjectId })),
        });
      }
    });

    return this.getByStudent(studentId);
  }

  async getClassmatesByStudent(studentId: number) {
    await this.ensureStudentExists(studentId);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        subject: {
          include: {
            enrollments: {
              include: {
                student: true,
              },
            },
            professor: true,
          },
        },
      },
      orderBy: { subjectId: 'asc' },
    });

    return enrollments.map((enrollment) => ({
      subjectId: enrollment.subject.id,
      subjectName: enrollment.subject.name,
      professorName: enrollment.subject.professor.name,
      classmates: enrollment.subject.enrollments
        .filter((item) => item.studentId !== studentId)
        .map((item) => `${item.student.firstName} ${item.student.lastName}`),
    }));
  }

  private async ensureStudentExists(studentId: number) {
    const count = await this.prisma.student.count({
      where: { id: studentId },
    });
    if (!count) {
      throw new NotFoundException(`No existe el estudiante ${studentId}`);
    }
  }

  private async validateSelectionRules(subjectIds: number[]) {
    if (subjectIds.length < 1) {
      throw new BadRequestException(
        'Un estudiante debe seleccionar al menos 1 materia',
      );
    }

    if (subjectIds.length > 3) {
      throw new BadRequestException(
        'Un estudiante solo puede seleccionar hasta 3 materias',
      );
    }

    const selectedSubjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, professorId: true },
    });

    if (selectedSubjects.length !== subjectIds.length) {
      throw new BadRequestException('Una o mas materias no existen');
    }

    const uniqueProfessorIds = new Set(
      selectedSubjects.map((subject) => subject.professorId),
    );
    if (uniqueProfessorIds.size !== selectedSubjects.length) {
      throw new BadRequestException(
        'Un estudiante no puede inscribirse en materias del mismo profesor',
      );
    }
  }
}
