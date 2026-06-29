const cds = require('@sap/cds');
const axios = require('axios');

module.exports = cds.service.impl(async function () {

    this.on('getTransitData', async () => {

        try {

            console.log("STEP 1 - Direct URL Test Started");

            const response = await axios.get(
                'https://yawss4hdev.sapyash.com:44301/sap/opu/odata/sap/ZI_SALESORDERSINTRANSIT_CDS/ZI_SalesOrdersInTransit?$top=20&$format=json',
                {
                    auth: {
                        username: 'SULC',
                        password: 'Nandasul@3108'
                    },
                    timeout: 30000
                }
            );

            console.log("STEP 2 - SUCCESS");
            console.log(JSON.stringify(response.data, null, 2));

            return response.data.d.results.map(item => ({
                SalesOrder: item.SalesOrder,
                SalesOrderItem: item.SalesOrderItem,
                Material: item.Material,
                ProductionPlant: item.ProductionPlant,
                DeliveryStatus: item.DeliveryStatus,
                InTransitStatus: item.InTransitStatus,
                DeliveryDocument: item.DeliveryDocument,
                TransitDelayDays: item.TransitDelayDays
            }));

        } catch (err) {

            console.log("STEP ERROR");

            if (err.response) {
                console.error("Status:", err.response.status);
                console.error("Data:", err.response.data);
            } else {
                console.error(err.message);
            }

            throw err;
        }

    });

});