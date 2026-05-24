const { prisma } = require('@vca/database');

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'admin' },
      include: {
        student: true,
        coach: true
      }
    });
    console.log("Success:", user);
  } catch (err) {
    console.error("Prisma error:", err.message);
  }
}

main().catch(console.error).finally(() => process.exit(0));
