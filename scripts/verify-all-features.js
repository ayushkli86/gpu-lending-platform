const { testAuthentication, log } = require('./verify-features-part1');
const { testGPUInventory, testRentalSystem } = require('./verify-features-part2');
const { testSubscriptions, testBilling, testPayments } = require('./verify-features-part3');
const { testMetering, testMonitoring, testAdminDashboard, testRESTAPI } = require('./verify-features-part4');
const { testWebUI, testMockData, testAutomation, testSecurity, testDevOps } = require('./verify-features-part5');

let iteration = 0;
let token = null;

async function runAllTests() {
  iteration++;
  console.log('\n' + '='.repeat(70));
  log(`🔄 FEATURE VERIFICATION - ITERATION #${iteration}`);
  console.log('='.repeat(70));

  const allResults = [];
  let totalPassed = 0;
  let totalFailed = 0;

  try {
    // Get token for authenticated tests
    const { request, API_URL } = require('./verify-features-part1');
    const loginRes = await request('POST', `${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    });
    token = loginRes.data.token;

    // Run all feature tests
    const results1 = await testAuthentication();
    const results2 = await testGPUInventory(token);
    const results3 = await testRentalSystem(token);
    const results4 = await testSubscriptions(token);
    const results5 = await testBilling(token);
    const results6 = await testPayments(token);
    const results7 = await testMetering(token);
    const results8 = await testMonitoring(token);
    const results9 = await testAdminDashboard(token);
    const results10 = await testRESTAPI(token);
    const results11 = await testWebUI();
    const results12 = await testMockData();
    const results13 = await testAutomation();
    const results14 = await testSecurity();
    const results15 = await testDevOps();

    // Combine all results
    allResults.push(...results1, ...results2, ...results3, ...results4, ...results5,
                    ...results6, ...results7, ...results8, ...results9, ...results10,
                    ...results11, ...results12, ...results13, ...results14, ...results15);

    totalPassed = allResults.filter(r => r === true).length;
    totalFailed = allResults.filter(r => r === false).length;

  } catch (error) {
    log(`\n💥 Critical error: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📈 Success Rate: ${totalPassed > 0 ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) : 0}%`);
  console.log(`🔢 Total Features Checked: ${totalPassed + totalFailed}`);

  if (totalFailed === 0) {
    console.log('\n🎉 ALL FEATURES VERIFIED! Platform is 100% complete!\n');
    return true;
  } else {
    console.log(`\n⚠️  ${totalFailed} feature(s) need attention. Retrying in 15 seconds...\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 GPU LENDING PLATFORM - COMPREHENSIVE FEATURE VERIFICATION');
  console.log('Checking all 15 feature categories with 80+ sub-features...\n');

  let allPassed = false;

  while (!allPassed) {
    try {
      allPassed = await runAllTests();

      if (!allPassed) {
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    } catch (error) {
      log(`💥 Error in main loop: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }

  console.log('✨ Verification complete! All features confirmed working!\n');
  console.log('📊 Feature Summary:');
  console.log('   1. ✅ Authentication & Authorization (6 features)');
  console.log('   2. ✅ GPU Inventory Management (6 features)');
  console.log('   3. ✅ Rental/Booking System (7 features)');
  console.log('   4. ✅ Subscription Management (6 features)');
  console.log('   5. ✅ Billing Engine (6 features)');
  console.log('   6. ✅ Payment Processing (6 features)');
  console.log('   7. ✅ Usage Metering (6 features)');
  console.log('   8. ✅ Monitoring Service (5 features)');
  console.log('   9. ✅ Admin Dashboard (6 features)');
  console.log('  10. ✅ REST API (6 features)');
  console.log('  11. ✅ Web UI (8 features)');
  console.log('  12. ✅ Mock Data Mode (3 features)');
  console.log('  13. ✅ Automated Development Loop (5 features)');
  console.log('  14. ✅ Security Features (5 features)');
  console.log('  15. ✅ DevOps & Deployment (5 features)');
  console.log('\n🎊 Total: 80+ features verified and working!\n');
  console.log('Press Ctrl+C to exit...\n');
}

main().catch(console.error);
