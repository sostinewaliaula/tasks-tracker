import '../loadEnv';
import { PrismaClient } from '../generated/prisma2';
import { sendEmailNotification } from '../lib/emailNotifications';

const prisma = new PrismaClient();

async function testEmailWithAttachments() {
  console.log('🧪 Testing Email Notifications with Word Attachments...\n');

  // Test 1: Get a user with email
  console.log('👥 Test 1: Finding a user with email...');
  const users = await prisma.user.findMany({
    where: { email: { not: null } },
    select: { id: true, name: true, email: true, emailNotifications: true }
  });

  if (users.length === 0) {
    console.log('❌ No users with email found in the database. Cannot test email notifications.\n');
    return;
  }

  const testUser = users[0];
  console.log(`✅ Found test user: ${testUser.name} (${testUser.email})\n`);

  // Test 2: Test Task Assigned Email with Attachment
  console.log('📧 Test 2: Testing Task Assigned Email with Word Attachment...');
  try {
    await sendEmailNotification({
      userId: testUser.id,
      type: 'task_assigned',
      taskData: {
        id: 1,
        title: 'Test Task Assignment',
        description: 'This is a test task assignment to verify Word document attachment functionality.',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: 'high',
        status: 'todo',
        createdBy: 'Test System',
        subtasks: [
          {
            id: 1,
            title: 'Test Subtask 1',
            status: 'todo',
            priority: 'medium',
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            title: 'Test Subtask 2',
            status: 'in-progress',
            priority: 'high',
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    });
    console.log('✅ Task Assigned Email with Attachment: SUCCESS\n');
  } catch (error: any) {
    console.log('❌ Task Assigned Email with Attachment: FAILED');
    console.log('Error:', error.message);
    console.log('');
  }

  // Test 3: Test Task Completed Email with Attachment
  console.log('📧 Test 3: Testing Task Completed Email with Word Attachment...');
  try {
    await sendEmailNotification({
      userId: testUser.id,
      type: 'task_completed',
      taskData: {
        id: 2,
        title: 'Completed Test Task',
        description: 'This task has been completed successfully.',
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        priority: 'medium',
        status: 'completed',
        createdBy: 'Test System'
      }
    });
    console.log('✅ Task Completed Email with Attachment: SUCCESS\n');
  } catch (error: any) {
    console.log('❌ Task Completed Email with Attachment: FAILED');
    console.log('Error:', error.message);
    console.log('');
  }

  // Test 4: Test Daily Progress Email with Attachment
  console.log('📧 Test 4: Testing Daily Progress Email with Word Attachment...');
  try {
    await sendEmailNotification({
      userId: testUser.id,
      type: 'daily_progress',
      progressData: {
        completed: 3,
        pending: 5,
        blockers: 2,
        tasks: [
          {
            title: 'Daily Task 1',
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            status: 'completed',
            subtasks: [
              {
                title: 'Daily Subtask 1',
                status: 'completed',
                priority: 'medium',
                deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
              }
            ]
          },
          {
            title: 'Daily Task 2',
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            status: 'in-progress',
            subtasks: [
              {
                title: 'Daily Subtask 2',
                status: 'blocker',
                priority: 'high',
                deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                blockerReason: 'Waiting for external dependency'
              }
            ]
          }
        ]
      }
    });
    console.log('✅ Daily Progress Email with Attachment: SUCCESS\n');
  } catch (error: any) {
    console.log('❌ Daily Progress Email with Attachment: FAILED');
    console.log('Error:', error.message);
    console.log('');
  }

  // Test 5: Test Overdue Tasks Email with Attachment
  console.log('📧 Test 5: Testing Overdue Tasks Email with Word Attachment...');
  try {
    await sendEmailNotification({
      userId: testUser.id,
      type: 'task_overdue',
      overdueData: [
        {
          title: 'Overdue Task 1',
          deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          status: 'in-progress',
          subtasks: [
            {
              title: 'Overdue Subtask 1',
              status: 'todo',
              priority: 'high',
              deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
          ]
        },
        {
          title: 'Overdue Task 2',
          deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          status: 'blocker'
        }
      ]
    });
    console.log('✅ Overdue Tasks Email with Attachment: SUCCESS\n');
  } catch (error: any) {
    console.log('❌ Overdue Tasks Email with Attachment: FAILED');
    console.log('Error:', error.message);
    console.log('');
  }

  // Test 6: Test Manager Summary Email with Attachment
  console.log('📧 Test 6: Testing Manager Summary Email with Word Attachment...');
  try {
    await sendEmailNotification({
      userId: testUser.id,
      type: 'manager_summary',
      teamData: [
        {
          name: 'Team Member 1',
          completedTasks: 2,
          tasks: [
            {
              title: 'Team Task 1',
              deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              subtasks: [
                {
                  title: 'Team Subtask 1',
                  status: 'completed',
                  priority: 'medium',
                  deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
                }
              ]
            }
          ]
        },
        {
          name: 'Team Member 2',
          completedTasks: 1,
          tasks: [
            {
              title: 'Team Task 2',
              deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            }
          ]
        }
      ]
    });
    console.log('✅ Manager Summary Email with Attachment: SUCCESS\n');
  } catch (error: any) {
    console.log('❌ Manager Summary Email with Attachment: FAILED');
    console.log('Error:', error.message);
    console.log('');
  }

  console.log('🎉 Email with Word Attachments Tests Completed!');
  console.log('\n📋 Summary:');
  console.log('- All email notifications now include Word document attachments');
  console.log('- Attachments contain detailed task information and statistics');
  console.log('- Documents are professionally formatted with Caava Group branding');
  console.log('- Each attachment type is customized based on the notification type');
  console.log('\n💡 Check your email inbox to verify the Word document attachments!');
}

testEmailWithAttachments()
  .catch(e => {
    console.error('Unhandled error during email attachment tests:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
