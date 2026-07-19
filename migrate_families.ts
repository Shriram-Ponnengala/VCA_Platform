import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateFamilies() {
  console.log('Starting Family migration...');
  
  const students = await prisma.student.findMany({
    include: { user: true }
  });

  console.log(`Found ${students.length} students to process.`);

  let migratedCount = 0;

  for (const student of students) {
    if (student.familyId) {
      console.log(`Student ${student.id} already has a family linked. Skipping.`);
      continue;
    }

    // Try to find if a family with the same primary parent mobile already exists
    // This simple heuristic assumes parentMobile + parentFirstName matches a family
    let family = null;
    
    if (student.parentMobile) {
      family = await prisma.family.findFirst({
        where: {
          parentMobile: student.parentMobile,
          parentFirstName: student.parentFirstName || undefined
        }
      });
    }

    if (!family) {
      // Create new family
      family = await prisma.family.create({
        data: {
          parentFirstName: student.parentFirstName || '',
          parentMiddleName: student.parentMiddleName || '',
          parentLastName: student.parentLastName || '',
          parentEmail: student.parentEmail || '',
          parentMobile: student.parentMobile || '',
          secParentFirstName: student.secParentFirstName || '',
          secParentMiddleName: student.secParentMiddleName || '',
          secParentLastName: student.secParentLastName || '',
          secParentEmail: student.secParentEmail || '',
          secParentMobile: student.secParentMobile || '',
          country: student.user?.country || '',
          city: student.user?.city || ''
        }
      });
      console.log(`Created new family ${family.id} for student ${student.id}`);
    } else {
      console.log(`Linking student ${student.id} to existing family ${family.id}`);
    }

    // Link student to the family
    await prisma.student.update({
      where: { id: student.id },
      data: { familyId: family.id }
    });

    migratedCount++;
  }

  console.log(`Migration complete! Successfully migrated ${migratedCount} students to use the Family model.`);
}

migrateFamilies()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
