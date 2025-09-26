import '../loadEnv';
import { PrismaClient } from '../generated/prisma2';
import { sendFridayMorningReport, sendFridayAfternoonReport } from '../lib/scheduledNotifications';

const prisma = new PrismaClient();

async function testFridayReports() {
  console.log('🧪 Testing Friday Morning and Afternoon Reports...\n');

  // Test 1: Friday Morning Report
  console.log('📧 Test 1: Testing Friday Morning Weekly Status Report (9am)...');
  try {
    await sendFridayMorningReport();
    console.log('✅ Friday Morning Report: SUCCESS\n');
  } catch (error: any) {
    console.log('❌ Friday Morning Report: FAILED');
    console.log('Error:', error.message);
    console.log('');
  }

  // Test 2: Friday Afternoon Report
  console.log('📧 Test 2: Testing Friday Afternoon Weekly Wrap-up Report (5:02pm)...');
  try {
    await sendFridayAfternoonReport();
    console.log('✅ Friday Afternoon Report: SUCCESS\n');
  } catch (error: any) {
    console.log('❌ Friday Afternoon Report: FAILED');
    console.log('Error:', error.message);
    console.log('');
  }

  // Test 3: Show current schedule
  console.log('📅 Current Email Schedule:');
  console.log('  • Monday-Friday 8:00 PM - Daily Progress Reports');
  console.log('  • Monday-Friday 8:00 PM - Manager Daily Summaries');
  console.log('  • Wednesday 9:00 AM - Weekly Reports');
  console.log('  • Thursday 4:30 PM - Overdue Task Alerts');
  console.log('  • Daily 9:00 AM - Deadline Reminders');
  console.log('  • Friday 9:00 AM - Weekly Status Report (NEW)');
  console.log('  • Friday 5:02 PM - Weekly Wrap-up + Department Progress (NEW)');
  console.log('');

  console.log('🎉 Friday Reports Test Completed!');
  console.log('\n📋 Summary:');
  console.log('- Friday Morning Report: Weekly status for all users');
  console.log('- Friday Afternoon Report: Weekly wrap-up + department progress for managers');
  console.log('- All reports include Word document attachments');
  console.log('- Reports are scheduled for Nairobi timezone');
  console.log('\n💡 Check email inboxes to verify the Friday reports!');
}

testFridayReports()
  .catch(e => {
    console.error('Unhandled error during Friday reports test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
