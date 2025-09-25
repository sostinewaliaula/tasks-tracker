import { prisma } from '../lib/prisma';

async function verifyManager() {
  try {
    console.log('=== Verifying Manager Assignment ===');
    
    // Check all departments with their managers
    const departments = await prisma.department.findMany({
      include: {
        manager: { select: { id: true, name: true, email: true, role: true } },
        users: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    console.log('\n--- All Departments ---');
    departments.forEach(dept => {
      console.log(`Department: ${dept.name} (ID: ${dept.id})`);
      console.log(`  Manager: ${dept.manager ? `${dept.manager.name} (${dept.manager.email})` : 'None'}`);
      console.log(`  Users: ${dept.users.length}`);
      dept.users.forEach(user => {
        console.log(`    - ${user.name} (${user.email}) - ${user.role}`);
      });
      console.log('');
    });

    // Check all managers
    const managers = await prisma.user.findMany({
      where: { role: 'manager' },
      include: { managingDepartments: true }
    });

    console.log('\n--- All Managers ---');
    managers.forEach(manager => {
      console.log(`Manager: ${manager.name} (${manager.email})`);
      console.log(`  Managing Departments: ${manager.managingDepartments.length}`);
      manager.managingDepartments.forEach(dept => {
        console.log(`    - ${dept.name} (ID: ${dept.id})`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('Error verifying manager:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyManager();
