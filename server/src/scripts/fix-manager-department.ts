import { prisma } from '../lib/prisma';

async function fixManagerDepartment() {
  try {
    console.log('Fixing manager department assignment...');
    
    // Find the manager user
    const manager = await prisma.user.findUnique({
      where: { ldapUid: 'manager.it' }
    });
    
    if (!manager) {
      console.log('Manager not found');
      return;
    }
    
    console.log('Found manager:', manager);
    
    // Find the IT-Team department
    const department = await prisma.department.findFirst({
      where: { name: 'IT-Team' }
    });
    
    if (!department) {
      console.log('IT-Team department not found');
      return;
    }
    
    console.log('Found department:', department);
    
    // Update the manager's department assignment
    await prisma.user.update({
      where: { id: manager.id },
      data: { departmentId: department.id }
    });
    
    // Update the department's manager assignment
    await prisma.department.update({
      where: { id: department.id },
      data: { managerId: manager.id }
    });
    
    console.log('Successfully updated manager department assignment');
    
    // Verify the changes
    const updatedManager = await prisma.user.findUnique({
      where: { id: manager.id },
      include: { department: true }
    });
    
    const updatedDepartment = await prisma.department.findUnique({
      where: { id: department.id },
      include: { manager: true }
    });
    
    console.log('Updated manager:', updatedManager);
    console.log('Updated department:', updatedDepartment);
    
  } catch (error) {
    console.error('Error fixing manager department:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixManagerDepartment();
