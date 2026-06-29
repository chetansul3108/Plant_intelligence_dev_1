const cds = require('@sap/cds');
const axios = require('axios');

module.exports = cds.service.impl(async function () {
  this.on('getSalesOrders', async () => {
    try {
      const url = 'http://yawss4hdev.sapyash.com:44301/sap/opu/odata/sap/ZI_SALESORDERSINTRANSIT_CDS/ZI_SalesOrdersInTransit?$format=json';

      const username = 'DABADEA';
      const password = '9755910449Ad!';

      const response = await axios.get(url, {
        auth: {
          username,
          password
        },
        headers: {
          Accept: 'application/json'
        }
      });

      return JSON.stringify(response.data);
    } catch (error) {
      return JSON.stringify({
        message: error.message,
        status: error.response?.status || 500,
        response: error.response?.data || null
      });
    }
  });
});
