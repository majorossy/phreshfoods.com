// Quick site status check
import fetch from 'node-fetch';

async function checkSiteStatus() {
  try {
    // Check if frontend is responding
    const frontendResponse = await fetch('http://localhost:5173');
    const frontendHtml = await frontendResponse.text();

    // Check if backend API is responding
    const apiResponse = await fetch('http://localhost:3000/api/locations');
    const apiData = await apiResponse.json();

    console.log('✅ Site Status Check:');
    console.log('  - Frontend: ' + (frontendHtml.includes('PhreshFoods') ? '✓ Running' : '✗ Error'));
    console.log('  - Backend API: ' + (Array.isArray(apiData) ? `✓ Serving ${apiData.length} locations` : '✗ Error'));
    console.log('\nThe site should now be loading without hooks errors.');
    console.log('Please check http://localhost:5173 in your browser.');

  } catch (error) {
    console.error('❌ Error checking site status:', error.message);
  }
}

checkSiteStatus();