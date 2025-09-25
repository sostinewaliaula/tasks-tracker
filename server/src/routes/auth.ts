import express from 'express';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import { authMiddleware, roleCheck } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { parse } from 'csv-parse';
import fs from 'fs';
import { ldapService } from '../ldap/ldapService';

const router = express.Router();

router.post('/login', authenticate);

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: (req as any).user.id },
            include: {
                department: { select: { id: true, name: true } },
                managingDepartments: { select: { id: true, name: true } }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Transform the user data to match frontend expectations
        const userData = {
            id: user.id.toString(),
            name: user.name,
            role: user.role,
            department_id: user.department?.id?.toString() || '',
            department: user.department?.name || '',
            email: user.email || '',
            ldap_uid: user.ldapUid,
            phone: user.phone || '',
            bio: user.bio || '',
            language: user.language,
            timezone: user.timezone,
            darkMode: user.darkMode,
            emailNotifications: user.emailNotifications,
            taskAssigned: user.taskAssigned,
            taskCompleted: user.taskCompleted,
            taskOverdue: user.taskOverdue,
            taskDeadline: user.taskDeadline,
            weeklyReport: user.weeklyReport,
            showEmail: user.showEmail,
            showPhone: user.showPhone,
            showBio: user.showBio,
            managingDepartments: user.managingDepartments
        };

        res.json({ user: userData });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

// Admin: import users via CSV (columns: ldapUid,email,name,role)
const upload = multer({ dest: 'uploads/' });
router.post('/import', authMiddleware, roleCheck(['admin']), upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = req.file.path;
    const results: any[] = [];

    try {
        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
                .on('data', (row) => results.push(row))
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        const upserts = results.map((row) => {
            const ldapUid = String(row.ldapUid || row.uid || row.username || '').trim();
            const name = String(row.name || ldapUid).trim();
            const email = row.email ? String(row.email).trim() : null;
            const role = ['admin', 'manager', 'employee'].includes(String(row.role)) ? String(row.role) as any : 'employee';
            if (!ldapUid) return null;
            return prisma.user.upsert({
                where: { ldapUid },
                update: { name, email, role },
                create: { ldapUid, name, email, role },
            });
        }).filter(Boolean) as Promise<any>[];

        await Promise.all(upserts);
        res.json({ imported: upserts.length });
    } catch (e) {
        console.error('Import error:', e);
        res.status(500).json({ error: 'Import failed' });
    } finally {
        fs.unlink(filePath, () => {});
    }
});

// Admin: Sync users from LDAP directory
router.post('/sync-ldap-users', authMiddleware, roleCheck(['admin']), async (req, res) => {
    try {
        // Optional filter prefix to limit to certain uids (e.g., by department), not implemented yet
        const ldapUsers = await ldapService.listUsers();
        const defaultEmailDomain = process.env.LDAP_DEFAULT_EMAIL_DOMAIN || 'turnkeyafrica.com';

        const ops = ldapUsers.map((lu) => {
            const email = lu.email ?? `${lu.uid}@${defaultEmailDomain}`;
            return prisma.user.upsert({
                where: { ldapUid: lu.uid },
                update: { name: lu.name, email },
                create: { ldapUid: lu.uid, name: lu.name, email, role: 'employee' },
            });
        });

        await Promise.all(ops);
        res.json({ synced: ops.length });
    } catch (e) {
        console.error('LDAP sync error:', e);
        res.status(500).json({ error: 'LDAP sync failed' });
    }
});

export default router;