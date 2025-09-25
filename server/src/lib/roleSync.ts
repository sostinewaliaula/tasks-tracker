import { prisma } from './prisma';

/**
 * Synchronizes user roles with their department manager status
 * This ensures that users with manager role are actually managing departments
 * and users managing departments have manager role
 */
export async function syncUserRolesWithDepartments() {
    try {
        console.log('Starting role synchronization...');
        
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
        
        // Demote users who have manager role but don't manage any department
        const usersToDemote = managerUsers.filter(user => !managerIds.has(user.id));
        
        if (usersToDemote.length > 0) {
            console.log(`Demoting ${usersToDemote.length} users from manager to employee:`, 
                usersToDemote.map(u => `${u.name} (${u.ldapUid})`));
            
            await prisma.user.updateMany({
                where: { 
                    id: { in: usersToDemote.map(u => u.id) }
                },
                data: { role: 'employee' }
            });
        }
        
        // Promote users who manage departments but don't have manager role
        const usersToPromote = departmentsWithManagers.filter(dept => {
            const user = managerUsers.find(u => u.id === dept.managerId);
            return !user; // Department has a manager but user doesn't have manager role
        });
        
        if (usersToPromote.length > 0) {
            console.log(`Promoting ${usersToPromote.length} users to manager role:`, 
                usersToPromote.map(d => `Department: ${d.name} (Manager ID: ${d.managerId})`));
            
            for (const dept of usersToPromote) {
                if (dept.managerId) {
                    await prisma.user.update({
                        where: { id: dept.managerId },
                        data: { role: 'manager' }
                    });
                }
            }
        }
        
        console.log('Role synchronization completed successfully');
        return {
            demoted: usersToDemote.length,
            promoted: usersToPromote.length
        };
        
    } catch (error) {
        console.error('Error during role synchronization:', error);
        throw error;
    }
}

/**
 * Validates that all users with manager role are actually managing departments
 */
export async function validateRoleConsistency() {
    try {
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
        
        // Find inconsistencies
        const usersWithoutDepartments = managerUsers.filter(user => !managerIds.has(user.id));
        const departmentsWithoutManagerRole = departmentsWithManagers.filter(dept => {
            const user = managerUsers.find(u => u.id === dept.managerId);
            return !user;
        });
        
        return {
            isConsistent: usersWithoutDepartments.length === 0 && departmentsWithoutManagerRole.length === 0,
            usersWithoutDepartments,
            departmentsWithoutManagerRole
        };
        
    } catch (error) {
        console.error('Error validating role consistency:', error);
        throw error;
    }
}
