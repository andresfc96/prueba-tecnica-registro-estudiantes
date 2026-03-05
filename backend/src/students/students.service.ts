import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStudentDto: CreateStudentDto) {
    try {
      return await this.prisma.student.create({
        data: createStudentDto,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll() {
    return this.prisma.student.findMany({
      orderBy: { id: 'asc' },
      include: {
        enrollments: {
          include: {
            subject: {
              include: { professor: true },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            subject: {
              include: { professor: true },
            },
          },
        },
      },
    });
    if (!student) {
      throw new NotFoundException(`No existe el estudiante ${id}`);
    }
    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    await this.ensureStudentExists(id);
    try {
      return await this.prisma.student.update({
        where: { id },
        data: updateStudentDto,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: number) {
    await this.ensureStudentExists(id);
    await this.prisma.student.delete({ where: { id } });
    return { message: `Estudiante ${id} eliminado` };
  }

  private async ensureStudentExists(id: number) {
    const exists = await this.prisma.student.count({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`No existe el estudiante ${id}`);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('El correo ya existe');
    }
    throw error;
  }
}
