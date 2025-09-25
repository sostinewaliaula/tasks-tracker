#!/usr/bin/env ts-node

/**
 * Script to fix role inconsistencies in the database
 * This will ensure that users with manager role are actually managing departments
 * and users managing departments have manager role
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRoleInconsistency() {
    try {
        console.log('🔍 Checking for role inconsistencies...');
        
        // Get all users with manager role
        const managerUsers = await prisma.user.findMany({
            where: { role: 'manager' },
            select: { id: true, name: true, ldapUid: true }
        });
        
        // Get all departments with managers
        const departmentsWithManagers = await prisma.department.findMany({
            where: { managerId: { not: null } },
            select: { id: true, name: true, managerId: true }
        });
        
        const managerIds = new Set(departmentsWithManagers.map(d => d.managerId));
        
        console.log(`📊 Found ${managerUsers.length} users with manager role`);
        console.log(`📊 Found ${departmentsWithManagers.length} departments with managers`);
        
        // Find users with manager role who don't manage any department
        const usersWithoutDepartments = managerUsers.filter(user => !managerIds.has(user.id));
        
        // Find departments with managers who don't have manager role
        const departmentsWithoutManagerRole = departmentsWithManagers.filter(dept => {
            const user = managerUsers.find(u => u.id === dept.managerId);
            return !user;
        });
        
        console.log(`\n🔧 Inconsistencies found:`);
        console.log(`   - ${usersWithoutDepartments.length} users with manager role but no departments`);
        console.log(`   - ${departmentsWithoutManagerRole.length} departments with managers who don't have manager role`);
        
        if (usersWithoutDepartments.length === 0 && departmentsWithoutManagerRole.length === 0) {
            console.log('✅ No inconsistencies found! Database is already consistent.');
            return;
        }
        
        // Fix users without departments
        if (usersWithoutDepartments.length > 0) {
            console.log(`\n🔧 Demoting ${usersWithoutDepartments.length} users from manager to employee...`);
            for (const user of usersWithoutDepartments) {
                console.log(`   - Demoting ${user.name} (${user.ldapUid})`);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: 'employee' }
                });
            }
        }
        
        // Fix departments without manager role
        if (departmentsWithoutManagerRole.length > 0) {
            console.log(`\n🔧 Promoting ${departmentsWithoutManagerRole.length} users to manager role...`);
            for (const dept of departmentsWithoutManagerRole) {
                if (dept.managerId) {
                    const user = await prisma.user.findUnique({
                        where: { id: dept.managerId },
                        select: { name: true, ldapUid: true }
                    });
                    if (user) {
                        console.log(`   - Promoting ${user.name} (${user.ldapUid}) to manager of ${dept.name}`);
                        await prisma.user.update({
                            where: { id: dept.managerId },
                            data: { role: 'manager' }
                        });
                    }
                }
            }
        }
        
        console.log('\n✅ Role inconsistency fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing role inconsistency:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
if (require.main === module) {
    fixRoleInconsistency()
        .then(() => {
            console.log('🎉 Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

export { fixRoleInconsistency };
