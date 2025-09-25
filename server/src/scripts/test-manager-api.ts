import { prisma } from '../lib/prisma';
import { authService } from '../ldap/authService';

async function testManagerAPI() {
  try {
    console.log('=== Testing Manager API Calls ===');
    
    // First, let's get the manager user
    const manager = await prisma.user.findFirst({
      where: { role: 'manager' },
      include: {
        department: true,
        managingDepartments: {
          include: {
            users: { select: { id: true, name: true, email: true, role: true } }
          }
        }
      }
    });

    if (!manager) {
      console.log('No manager found');
      return;
    }

    console.log('\n--- Manager User ---');
    console.log(`Name: ${manager.name}`);
    console.log(`Email: ${manager.email}`);
    console.log(`Role: ${manager.role}`);
    console.log(`Department ID: ${manager.departmentId}`);
    console.log(`Managing Departments: ${manager.managingDepartments.length}`);

    // Test the departments query that the API should return
    console.log('\n--- Testing Departments Query ---');
    const departments = await prisma.department.findFirst({
      where: { managerId: manager.id },
      include: {
        manager: { select: { id: true, name: true } },
        users: { select: { id: true, name: true, role: true } },
        children: {
          include: {
            manager: { select: { id: true, name: true } },
            users: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    console.log('Department found:', departments ? 'Yes' : 'No');
    if (departments) {
      console.log(`Department Name: ${departments.name}`);
      console.log(`Department ID: ${departments.id}`);
      console.log(`Manager: ${departments.manager?.name || 'None'}`);
      console.log(`Users: ${departments.users.length}`);
      departments.users.forEach(user => {
        console.log(`  - ${user.name} (${user.role})`);
      });
    }

    // Test what the API should return
    console.log('\n--- API Response Simulation ---');
    const apiResponse = departments ? [departments] : [];
    console.log('API Response:', JSON.stringify(apiResponse, null, 2));

  } catch (error) {
    console.error('Error testing manager API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testManagerAPI();
