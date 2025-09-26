import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing manager role assignment...');
  
  // Find the manager user
  const managerUser = await prisma.user.findUnique({ 
    where: { ldapUid: 'manager.it' } 
  });
  
  if (!managerUser) {
    console.error('Manager user "manager.it" not found.');
    return;
  }
  
  console.log('Found manager:', managerUser);
  
  // Update the manager's role
  const updatedManager = await prisma.user.update({
    where: { id: managerUser.id },
    data: { role: 'manager' },
    include: { department: true }
  });
  
  console.log('Successfully updated manager role');
  console.log('Updated manager:', updatedManager);
  
  // Also update the department's managerId if needed
  const itDepartment = await prisma.department.findFirst({ 
    where: { name: 'IT-Team' } 
  });
  
  if (itDepartment) {
    const updatedDepartment = await prisma.department.update({
      where: { id: itDepartment.id },
      data: { managerId: managerUser.id },
      include: { manager: true }
    });
    
    console.log('Updated department:', updatedDepartment);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
