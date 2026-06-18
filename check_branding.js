const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'branding' }
  });
  if (setting) {
    const data = setting.data;
    console.log("Branding type:", data.classroomBackground ? data.classroomBackground.type : "undefined");
    if (data.classroomBackground) {
      console.log("classroomBackground keys:", Object.keys(data.classroomBackground));
      console.log("imageSource:", data.classroomBackground.imageSource);
      console.log("imageUrl is set:", !!data.classroomBackground.imageUrl);
      console.log("imageUpload length:", data.classroomBackground.imageUpload ? data.classroomBackground.imageUpload.length : 0);
      console.log("imageUpload snippet:", data.classroomBackground.imageUpload ? data.classroomBackground.imageUpload.substring(0, 50) : "empty");
    }
  } else {
    console.log("No branding setting found in DB.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
