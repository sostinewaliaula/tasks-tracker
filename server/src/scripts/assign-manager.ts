import { prisma } from '../lib/prisma';

async function assignManager() {
  try {
    // Find the manager user
    const manager = await prisma.user.findFirst({
      where: { role: 'manager' }
    });

    if (!manager) {
      console.log('No manager found');
      return;
    }

    console.log('Found manager:', manager.name, manager.email);

    // Find a department without a manager
    const department = await prisma.department.findFirst({
      where: { managerId: null }
    });

    if (!department) {
      console.log('No department without manager found');
      return;
    }

    console.log('Found department without manager:', department.name);

    // Assign the manager to the department
    const updatedDepartment = await prisma.department.update({
      where: { id: department.id },
      data: { managerId: manager.id }
    });

    // Update the manager's department assignment
    await prisma.user.update({
      where: { id: manager.id },
      data: { departmentId: department.id }
    });

    console.log('Successfully assigned manager to department:', updatedDepartment.name);
  } catch (error) {
    console.error('Error assigning manager:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignManager();
