'use strict';

const cds = require('@sap/cds');
const axios = require('axios');
const https = require('https');
const { getAISummary } = require('./ai-service');
const { SELECT, DELETE, INSERT } = cds.ql;
require('dotenv').config();

const BASE_URL =
  process.env.SAP_ODATA_BASE_URL ||
  'https://yawss4hdev.sapyash.com:44301/sap/opu/odata/sap';

const AUTH = {
  username: process.env.SAP_ODATA_USER || '',
  password: process.env.SAP_ODATA_PASSWORD || ''
};

const axiosInstance = axios.create({
  auth: AUTH,
  timeout: 1200000,
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

function formatSapDate(value) {
  if (!value || typeof value !== 'string') return '';
  const match = /\/Date\((\d+)\)\//.exec(value);
  if (!match) return value;

  const date = new Date(Number(match[1]));
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
async function fetchRaw(serviceName, entityName, top = 10000) {
    const url = `${BASE_URL}/${serviceName}/${entityName}?$top=${top}&$format=json`;

    console.log("Fetching:", url);

    try {
        const response = await axios.get(url, {
            auth: AUTH,
            timeout: 120000,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        console.log("Fetched", response.data.d.results.length, "rows");

        return response.data.d.results;

    } catch (err) {

        console.log("========== AXIOS ERROR ==========");
        console.log("name:", err.name);
        console.log("code:", err.code);
        console.log("message:", err.message);
        console.dir(err, { depth: 5 });

        throw err;
    }
}

function handleError(actionName, err, req) {
  if (err.response) {
    console.error(`[${actionName}] Status:`, err.response.status);
    console.error(
      `[${actionName}] Data:`,
      JSON.stringify(err.response.data, null, 2)
    );

    if (req && typeof req.reject === "function") {
      return req.reject(err.response.status, `${actionName} failed`);
    }

    throw new Error(`${actionName} failed: HTTP ${err.response.status}`);
  }

  console.error(`[${actionName}]`, err.message);

  if (req && typeof req.reject === "function") {
    return req.reject(500, `${actionName} failed: ${err.message}`);
  }

  throw new Error(`${actionName} failed: ${err.message}`);
}

function dedupeRows(rows, keyFields = []) {
  if (!rows || !rows.length || !keyFields.length) return rows || [];

  const seen = new Map();
  for (const row of rows) {
    const key = keyFields.map(k => row[k] ?? '').join('||');
    if (!seen.has(key)) {
      seen.set(key, row);
    }
  }

  return [...seen.values()];
}

module.exports = cds.service.impl(async function () {
  const db = await cds.connect.to('db');

  const {
    SalesOrdersInTransit,
    OnTimeDelivery,
    StockShortage,
    PlannedOrderSchedule,
    SalesToPayment,
    MaterialVH,
    ShippingPointVH,
    CustomerVH
  } = cds.entities('transit.db');

  async function persist(entity, rows, keyFields = []) {
    if (!rows || !rows.length) return rows;

    const cleaned = dedupeRows(rows, keyFields);

    await db.run(DELETE.from(entity));
    await db.run(INSERT.into(entity).entries(cleaned));

    return cleaned;
  }

 this.on('READ', 'SalesOrdersInTransit', async req => {
    return db.run(
        SELECT.from(SalesOrdersInTransit)
    );
});

this.on('READ', 'OnTimeDelivery', async req => {
    return db.run(
        SELECT.from(OnTimeDelivery)
    );
});


this.on('READ', 'PlannedOrderSchedule', async req => {
    return db.run(
        SELECT.from(PlannedOrderSchedule)
    );
});

this.on('READ', 'SalesToPayment', async req => {
    return db.run(
        SELECT.from(SalesToPayment)
    );
});

this.on('READ', 'MaterialVH', async req => {
    return db.run(
        SELECT.from(MaterialVH)
    );
});

this.on('READ', 'ShippingPointVH', async req => {
    return db.run(
        SELECT.from(ShippingPointVH)
    );
});

this.on('READ', 'CustomerVH', async req => {
    return db.run(
        SELECT.from(CustomerVH)
    );
});
  this.on('getAISummary', async req => {
    try {
      const {
        kpiName,
        kpiValue,
        unit,
        severity,
        target,
        plant,
        additionalContext,
        forecastData
      } = req.data;

      if (!kpiName || !kpiValue || !severity) {
        return req.reject(400, 'kpiName, kpiValue and severity are required');
      }

      return await getAISummary({
        kpiName,
        kpiValue,
        unit,
        severity,
        target,
        plant,
        additionalContext,
        forecastData
      });
    } catch (err) {
      return handleError('getAISummary', err, req);
    }
  });

this.on("syncSalesOrdersInTransit", async req => {
    try {
        const rows = await fetchRaw(
            "ZI_SALESORDERSINTRANSIT_CDS",
            "ZI_SalesOrdersInTransit"
        );

        const mapped = rows.map(item => ({
            SalesOrder: item.SalesOrder ?? "",
            Delivery: item.DeliveryDocument ?? "",
            Shipment: item.SalesOrderItem ?? "",
            Carrier: item.ShippingPoint ?? "",
            Route: item.Route ?? "",
            Customer: item.DestCountry ?? "",
            DispatchDate: formatSapDate(item.PlannedGIDate),
            ETA: formatSapDate(item.ETA || item.PlannedGIDate),
            RequestedDeliveryDate: formatSapDate(item.RequestedDeliveryDate),
            CurrentStatus: item.InTransitStatus ?? ""
        }));

        await persist(
            SalesOrdersInTransit,
            mapped,
            ["SalesOrder", "Delivery", "Shipment"]
        );

        return "Sales Orders synchronized successfully";

    } catch (err) {
        return handleError("syncSalesOrdersInTransit", err, req);
    }
});

this.on("syncOnTimeDelivery", async req => {
    try {

        const rows = await fetchRaw(
            "Z_ON_TIME_DELIVERY_RAW_CDS",
            "Z_ON_TIME_DELIVERY_RAW"
        );

        const mapped = rows.map(item => ({
            SalesOrder: item.ReferenceSDDocument ?? "",
            Delivery: item.DeliveryDocument ?? "",
            Material: item.Material ?? "",
            Customer: item.CustomerName ?? "",
            PlannedDeliveryDate: formatSapDate(
                item.ItemPlannedGoodsIssueDate ||
                item.PlannedGoodsIssueDate ||
                item.ConfirmedDeliveryDate ||
                item.RequestedDeliveryDate ||
                item.DeliveryDate
            ),
            ActualGIDeliveryDate: formatSapDate(
                item.ItemActualGoodsIssueDate ||
                item.ActualGoodsMovementDate ||
                item.DeliveryDate
            ),
            Quantity: String(
                item.ActualDeliveryQuantity ??
                item.DeliveredQtyInOrderQtyUnit ??
                ""
            ),
            OrderedQty: String(item.ScheduleLineOrderQuantity ?? ""),
            ActualDeliveryQuantity: String(item.ActualDeliveryQuantity ?? ""),
            Plant: item.Plant ?? "",
            ShippingPoint: item.ShippingPoint ?? ""
        }));

        await persist(
            OnTimeDelivery,
            mapped,
            ["SalesOrder", "Delivery", "Material"]
        );

        return "On Time Delivery synchronized successfully";

    } catch (err) {
        return handleError("syncOnTimeDelivery", err, req);
    }
});

this.on("syncStockShortage", async req => {
    try {
        const rows = await fetchRaw(
            "Z_I_StockShortage_CDS",
            "Z_I_StockShortage"
        );

        const mapped = rows.map(item => {
            const availableQty = Number(
                item.AvailableQty ?? item.CurrentAvailableStock ?? 0
            );
            const requirementQty = Number(
                item.RequirementQty ?? item.RequiredQty ?? 0
            );
            const shortageQty = Number(
                item.TotalStockDecreaseQty ?? item.ShortageQty ?? 0
            );
            const standardPrice = Number(
                item.StandardPrice ??
                item.MaterialStandardPrice ??
                item.MovingAveragePrice ??
                item.Price ??
                0
            );

            return {
                Material: item.Material ?? "",
                Plant: item.Plant ?? "",
                StorageLocation: item.StorageLocation ?? "",
                RequirementDate: formatSapDate(item.RequirementDate),
                AvailableQty: String(availableQty),
                RequirementQty: String(requirementQty),
                ShortageQty: String(shortageQty),
                StandardPrice: String(standardPrice),
                ShortageValue: String(shortageQty * standardPrice),
                MRPController: item.MRPController ?? ""
            };
        });

        await persist(
            StockShortage,
            mapped,
            ["Material", "Plant", "StorageLocation", "RequirementDate"]
        );

        return "Stock Shortage synchronized successfully";

    } catch (err) {
        return handleError("syncStockShortage", err, req);
    }
});

this.on("syncPlannedOrderSchedule", async req => {
    try {

        const rows = await fetchRaw(
            "ZI_PLANNEDORDER_CDS",
            "ZI_PlannedOrder"
        );

        const mapped = rows.map(item => ({
            PlannedOrder: item.PlannedOrder ?? "",
            Material: item.Material ?? "",
            Plant: item.Plant ?? "",
            BasicStartDate: formatSapDate(item.PlndOrderPlannedStartDate),
            BasicFinishDate: formatSapDate(item.ProductionEndDate),
            ScheduledDate: formatSapDate(item.ConfirmedEndDate),
            RequiredDate: formatSapDate(
                item.ProductionStartDate || item.ActualStartDate
            ),
            Quantity: String(item.PlannedQty ?? item.ConfirmedQty ?? ""),
            Status: item.PlannedOrderType ?? item.SystemStatus ?? ""
        }));

        await persist(
            PlannedOrderSchedule,
            mapped,
            ["PlannedOrder", "Material", "Plant"]
        );

        return "Planned Order Schedule synchronized successfully";

    } catch (err) {
        return handleError("syncPlannedOrderSchedule", err, req);
    }
});

this.on("syncSalesToPayment", async req => {
    try {

        const rows = await fetchRaw(
            "ZC_ESJI_SALESTOPAY_CDS",
            "ZC_ESJI_SalesToPay"
        );

        const mapped = rows.map(item => ({
            SalesOrder: item.SalesOrder ?? "",
            BillingDocument: item.BillingDocument ?? item.SalesOrderItem ?? "",
            OrderCreationDate: formatSapDate(item.OrderCreationDate),
            GoodsIssueDate: formatSapDate(item.GoodsIssueDate),
            InvoiceDate: formatSapDate(item.InvoiceCreationDate),
            PaymentStatus: item.PaymentMethod ?? "",
            NetAmount: String(item.InvoiceNetAmount ?? ""),
            Customer: item.Customer ?? "",
            DueDate: formatSapDate(item.DueDate),
            ClearingDate: formatSapDate(item.PaymentClearingDate),
            DaysOrderToGI: Number(item.DaysOrderToGI ?? 0),
            DaysGIToInvoice: Number(item.DaysGIToInvoice ?? 0),
            DaysInvoiceToPayment: Number(item.DaysInvoiceToPayment ?? 0)
        }));

        await persist(
            SalesToPayment,
            mapped,
            ["SalesOrder", "BillingDocument"]
        );

       return "Sales to payment synchronized successfully";

    } catch (err) {
        return handleError("syncSalesToPayment", err, req);
    }
});

this.on("syncMaterialVH", async req => {
    try {

        const rows = await fetchRaw(
            "ZI_SALESORDERSINTRANSIT_CDS",
            "I_MaterialStdVH",
            50
        );

        const mapped = rows.map(item => ({
            Material: item.Material ?? "",
            MaterialDescription: item.Material_Text ?? ""
        }));

        await persist(
            MaterialVH,
            mapped,
            ["Material"]
        );

        return "Material Value Help synchronized successfully";

    } catch (err) {
        return handleError("syncMaterialVH", err, req);
    }
});
this.on("syncShippingPointVH", async req => {
    try {

        const rows = await fetchRaw(
            "ZI_SALESORDERSINTRANSIT_CDS",
            "I_ShippingPointStdVH",
            50
        );

        const mapped = rows.map(item => ({
            ShippingPoint: item.ShippingPoint ?? "",
            ShippingPointDescription:
                item.ShippingPointName ||
                item.ShippingPoint_Text ||
                ""
        }));

        await persist(
            ShippingPointVH,
            mapped,
            ["ShippingPoint"]
        );

        return "Shipping Point Value Help synchronized successfully";

    } catch (err) {
        return handleError("syncShippingPointVH", err, req);
    }
});

this.on("syncCustomerVH", async req => {
    try {

        const rows = await fetchRaw(
            "ZC_ESJI_SALESTOPAY_CDS",
            "I_Customer_VH",
            50
        );

        const mapped = rows.map(item => ({
            Customer: item.Customer ?? "",
            CustomerName:
                item.CustomerName ||
                item.BusinessPartnerName1 ||
                ""
        }));

        await persist(
            CustomerVH,
            mapped,
            ["Customer"]
        );

        return "Customer Value Help synchronized successfully";

    } catch (err) {
        return handleError("syncCustomerVH", err, req);
    }
});
this.on("syncAllData", async req => {
    try {

        console.log("START SalesOrders");
        await this.emit("syncSalesOrdersInTransit");
        console.log("DONE SalesOrders");


        console.log("START OnTimeDelivery");
        await this.emit("syncOnTimeDelivery");
        console.log("DONE OnTimeDelivery");


        console.log("START StockShortage");
        await this.emit("syncStockShortage");
        console.log("DONE StockShortage");


        console.log("START PlannedOrder");
        await this.emit("syncPlannedOrderSchedule");
        console.log("DONE PlannedOrder");


        console.log("START SalesToPayment");
        await this.emit("syncSalesToPayment");
        console.log("DONE SalesToPayment");


        console.log("START MaterialVH");
        await this.emit("syncMaterialVH");
        console.log("DONE MaterialVH");


        console.log("START ShippingPointVH");
        await this.emit("syncShippingPointVH");
        console.log("DONE ShippingPointVH");


        console.log("START CustomerVH");
        await this.emit("syncCustomerVH");
        console.log("DONE CustomerVH");


        return "All data synchronized successfully.";

    } catch(err){
        return handleError("syncAllData", err, req);
    }
});
});