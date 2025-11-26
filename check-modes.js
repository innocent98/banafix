const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const modes = await prisma.deliveryMode.findMany()
  console.log('Delivery Modes:', modes)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
