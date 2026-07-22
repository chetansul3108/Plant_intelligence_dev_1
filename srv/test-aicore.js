const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

async function testDestination() {
  try {
    const response = await executeHttpRequest(
      { destinationName: 'aicore' },
      {
        method: 'GET',
        url: '/v2/lm/deployments',
        headers: { 'AI-Resource-Group': 'default' }
      }
    );
    console.log('SUCCESS:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('FAILED:', err.response?.status, err.response?.data || err.message);
  }
}

testDestination();