import '../loadEnv';
import { PrismaClient } from '../generated/prisma2';
import { sendMail } from '../lib/mailer';
import { sendEmailNotification } from '../lib/emailNotifications';
// import { NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function testEmailNotifications() {
  console.log('🧪 Starting Email Notification Tests...\n');

  // Test 1: Basic SMTP Connection Test
  console.log('📧 Test 1: Testing SMTP Connection...');
  try {
    const testEmail = {
      to: 'test@example.com',
      subject: 'SMTP Connection Test',
      html: '<h1>Test Email</h1><p>This is a test email to verify SMTP connection.</p>',
      text: 'Test Email - This is a test email to verify SMTP connection.'
    };

    // Note: This will fail if SMTP is not configured, but we can see the error
    await sendMail(testEmail);
    console.log('✅ SMTP Connection: SUCCESS\n');
  } catch (error: any) {
    console.log('❌ SMTP Connection: FAILED');
    console.log('Error:', error.message);
    console.log('This is expected if SMTP is not configured.\n');
  }

  // Test 2: Check Environment Variables
  console.log('🔧 Test 2: Checking Environment Variables...');
  const envVars = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    SMTP_SECURE: process.env.SMTP_SECURE
  };

  console.log('Environment Variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const displayValue = value ? (key.includes('PASS') ? '***' : value) : 'NOT SET';
    console.log(`  ${status} ${key}: ${displayValue}`);
  });
  console.log('');

  // Test 3: Check Database Users
  console.log('👥 Test 3: Checking Database Users...');
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailNotifications: true,
        taskAssigned: true,
        taskCompleted: true,
        taskOverdue: true,
        taskDeadline: true,
        weeklyReport: true
      }
    });

    console.log(`Found ${users.length} users in database:`);
    users.forEach(user => {
      const emailStatus = user.email ? '✅' : '❌';
      const notificationsStatus = user.emailNotifications ? '✅' : '❌';
      console.log(`  ${emailStatus} ${user.name} (${user.email || 'No email'}) - Notifications: ${notificationsStatus}`);
    });
    console.log('');

    // Test 4: Test Email Notification Service
    if (users.length > 0) {
      console.log('📬 Test 4: Testing Email Notification Service...');
      const testUser = users[0];
      
      if (testUser.email) {
        try {
          await sendEmailNotification({
            userId: testUser.id,
            type: 'general' as any,
            customMessage: 'This is a test notification to verify email functionality.'
          });
          console.log(`✅ Email Notification Service: SUCCESS (sent to ${testUser.email})\n`);
        } catch (error: any) {
          console.log('❌ Email Notification Service: FAILED');
          console.log('Error:', error.message);
          console.log('');
        }
      } else {
        console.log('⚠️  Email Notification Service: SKIPPED (no email address for test user)\n');
      }
    }

    // Test 5: Test Different Notification Types
    console.log('🎯 Test 5: Testing Different Notification Types...');
    const testUser = users.find(u => u.email);
    
    if (testUser) {
      const notificationTypes = [
        'task_assigned',
        'task_completed',
        'task_overdue',
        'task_deadline',
        'daily_progress',
        'weekly_report'
      ];

      for (const type of notificationTypes) {
        try {
          await sendEmailNotification({
            userId: testUser.id,
            type: type as any,
            customMessage: `Test notification for ${type}`
          });
          console.log(`✅ ${type}: SUCCESS`);
        } catch (error: any) {
          console.log(`❌ ${type}: FAILED - ${error.message}`);
        }
      }
      console.log('');
    } else {
      console.log('⚠️  Notification Types Test: SKIPPED (no user with email found)\n');
    }

  } catch (error: any) {
    console.log('❌ Database Test: FAILED');
    console.log('Error:', error.message);
    console.log('');
  }

  // Test 6: Create Test Notification in Database
  console.log('💾 Test 6: Testing Notification Creation...');
  try {
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length > 0) {
      const testNotification = await prisma.notification.create({
        data: {
          message: 'Test notification created for email testing',
          type: 'general' as any,
          category: 'test',
          priority: 'medium',
          userId: users[0].id,
          metadata: { test: true, timestamp: new Date().toISOString() }
        }
      });
      console.log(`✅ Notification Creation: SUCCESS (ID: ${testNotification.id})`);
      
      // Clean up test notification
      await prisma.notification.delete({ where: { id: testNotification.id } });
      console.log('✅ Test notification cleaned up\n');
    } else {
      console.log('⚠️  Notification Creation: SKIPPED (no users found)\n');
    }
  } catch (error: any) {
    console.log('❌ Notification Creation: FAILED');
    console.log('Error:', error.message);
    console.log('');
  }

  // Test 7: Test Scheduled Notifications
  console.log('⏰ Test 7: Testing Scheduled Notification Functions...');
  try {
    const { sendDailyProgressEmails, sendManagerSummaryEmails, sendWeeklyReports } = await import('../lib/scheduledNotifications');
    
    console.log('Testing sendDailyProgressEmails...');
    await sendDailyProgressEmails();
    console.log('✅ Daily Progress Emails: Function executed successfully');
    
    console.log('Testing sendManagerSummaryEmails...');
    await sendManagerSummaryEmails();
    console.log('✅ Manager Summary Emails: Function executed successfully');
    
    console.log('Testing sendWeeklyReports...');
    await sendWeeklyReports();
    console.log('✅ Weekly Reports: Function executed successfully');
    console.log('');
  } catch (error: any) {
    console.log('❌ Scheduled Notifications: FAILED');
    console.log('Error:', error.message);
    console.log('');
  }

  console.log('🎉 Email Notification Tests Complete!');
  console.log('\n📋 Summary:');
  console.log('- Check the results above to see which tests passed/failed');
  console.log('- If SMTP tests failed, you need to configure email settings');
  console.log('- If database tests failed, check your database connection');
  console.log('- If notification tests failed, check user email preferences');
  console.log('\n💡 To configure email notifications:');
  console.log('1. Create a .env file in the server directory');
  console.log('2. Add SMTP configuration variables:');
  console.log('   SMTP_HOST=your-smtp-host');
  console.log('   SMTP_PORT=587');
  console.log('   SMTP_USER=your-email@domain.com');
  console.log('   SMTP_PASS=your-password');
  console.log('   SMTP_FROM=your-email@domain.com');
  console.log('   SMTP_SECURE=false');
}

// Run the tests
testEmailNotifications()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
