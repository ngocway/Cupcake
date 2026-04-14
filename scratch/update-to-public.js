const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const assignments = await prisma.assignment.findMany();
  console.log("Assignments:", assignments.map(a => ({ id: a.id, title: a.title, status: a.status })));
  
  if (assignments.length > 0) {
    const first = assignments[0];
    await prisma.assignment.update({
      where: { id: first.id },
      data: { status: "PUBLIC" }
    });
    console.log("Updated assignment to PUBLIC:", first.title);
  }
}

main();
