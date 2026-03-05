import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EnrollmentsService', () => {
  const prismaMock = {
    student: { count: jest.fn() },
    subject: { findMany: jest.fn() },
    enrollment: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const service = new EnrollmentsService(
    prismaMock as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.student.count.mockResolvedValue(1);
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          enrollment: prismaMock.enrollment,
        }),
    );
  });

  it('rejects more than 3 subjects', async () => {
    await expect(
      service.updateByStudent(1, { subjectIds: [1, 2, 3, 4] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty subject selection', async () => {
    await expect(
      service.updateByStudent(1, { subjectIds: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects subjects from same professor', async () => {
    prismaMock.subject.findMany.mockResolvedValue([
      { id: 1, professorId: 99 },
      { id: 2, professorId: 99 },
    ]);

    await expect(
      service.updateByStudent(1, { subjectIds: [1, 2] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when subject ids do not exist', async () => {
    prismaMock.subject.findMany.mockResolvedValue([{ id: 1, professorId: 20 }]);

    await expect(
      service.updateByStudent(1, { subjectIds: [1, 2] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when student does not exist', async () => {
    prismaMock.student.count.mockResolvedValue(0);
    await expect(service.getByStudent(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates enrollment when rules pass', async () => {
    prismaMock.subject.findMany.mockResolvedValue([
      { id: 1, professorId: 1 },
      { id: 2, professorId: 2 },
      { id: 3, professorId: 3 },
    ]);
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        studentId: 1,
        subjectId: 1,
        subject: {
          id: 1,
          name: 'Matematicas I',
          credits: 3,
          professor: { id: 1, name: 'Carlos Mendez' },
        },
      },
    ]);

    const result = await service.updateByStudent(1, { subjectIds: [1, 2, 3] });

    expect(prismaMock.enrollment.deleteMany).toHaveBeenCalledWith({
      where: { studentId: 1 },
    });
    expect(prismaMock.enrollment.createMany).toHaveBeenCalledWith({
      data: [
        { studentId: 1, subjectId: 1 },
        { studentId: 1, subjectId: 2 },
        { studentId: 1, subjectId: 3 },
      ],
    });
    expect(result.totalCredits).toBe(3);
  });
});
