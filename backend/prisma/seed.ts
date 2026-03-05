import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const professors = [
    { name: 'Carlos Mendez' },
    { name: 'Laura Rios' },
    { name: 'Andres Gomez' },
    { name: 'Patricia Lara' },
    { name: 'Diego Ruiz' },
  ];

  for (const professor of professors) {
    await prisma.professor.upsert({
      where: { name: professor.name },
      update: {},
      create: professor,
    });
  }

  const professorMap = new Map(
    (await prisma.professor.findMany()).map((professor) => [
      professor.name,
      professor.id,
    ]),
  );

  const subjects = [
    { name: 'Matematicas I', professorName: 'Carlos Mendez' },
    { name: 'Estadistica', professorName: 'Carlos Mendez' },
    { name: 'Programacion I', professorName: 'Laura Rios' },
    { name: 'Estructuras de Datos', professorName: 'Laura Rios' },
    { name: 'Bases de Datos', professorName: 'Andres Gomez' },
    { name: 'Redes', professorName: 'Andres Gomez' },
    { name: 'Sistemas Operativos', professorName: 'Patricia Lara' },
    { name: 'Ingenieria de Software', professorName: 'Patricia Lara' },
    { name: 'Arquitectura de Computadores', professorName: 'Diego Ruiz' },
    { name: 'Seguridad Informatica', professorName: 'Diego Ruiz' },
  ];

  for (const subject of subjects) {
    const professorId = professorMap.get(subject.professorName);
    if (!professorId) {
      throw new Error(`Professor not found: ${subject.professorName}`);
    }

    await prisma.subject.upsert({
      where: { name: subject.name },
      update: {
        professorId,
        credits: 3,
      },
      create: {
        name: subject.name,
        credits: 3,
        professorId,
      },
    });
  }
}

main()
  .catch(async (error) => {
    // Seed should fail loudly in CI/local setup.
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
