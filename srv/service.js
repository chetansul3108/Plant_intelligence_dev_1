'use strict';

const cds = require('@sap/cds');
const axios = require('axios');
const https = require('https');

const BASE_URL = 'https://yawss4hdev.sapyash.com:44301/sap/opu/odata/sap';
const AUTH = {
    username: 'SULC',
    password: 'Nandasul@3108'
};

const axiosInstance = axios.create({
    auth: AUTH,
    timeout: 30000,
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

function formatSapDate(value) {
    if (!value || typeof value !== 'string') return null;
    const match = /\/Date\((\d+)\)\//.exec(value);
    if (!match) return value;
    const date = new Date(Number(match[1]));
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

async function fetchRaw(serviceName, entityName, top = 100) {
    const url = `${BASE_URL}/${serviceName}/${entityName}?$top=${top}&$format=json`;
    console.log('[CAP] Fetching:', url);

    try {
        const response = await axiosInstance.get(url);
        return response?.data?.d?.results || [];
    } catch (err) {
        console.error('[CAP] URL failed:', url);
        if (err.response) {
            console.error('[CAP] Status:', err.response.status);
            console.error('[CAP] Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('[CAP] Message:', err.message);
        }
        throw err;
    }
}

function handleError(actionName, err) {
    if (err.response) {
        console.error(`[${actionName}] Status:`, err.response.status);
        console.error(`[${actionName}] Data:`, JSON.stringify(err.response.data, null, 2));
        throw new Error(`${actionName} failed: HTTP ${err.response.status}`);
    }
    console.error(`[${actionName}]`, err.message);
    throw new Error(`${actionName} failed: ${err.message}`);
}

module.exports = cds.service.impl(async function () {

    this.on('getSalesOrdersInTransit', async () => {
        try {
            const rows = await fetchRaw(
                'ZI_SALESORDERSINTRANSIT_CDS',
                'ZI_SalesOrdersInTransit'
            );

            return rows.map(item => ({
                SalesOrder: item.SalesOrder ?? '',
                Delivery: item.DeliveryDocument ?? '',
                Shipment: item.SalesOrderItem ?? '',
                Carrier: item.ShippingPoint ?? '',
                Customer: item.DestCountry ?? '',
                DispatchDate: formatSapDate(item.PlannedGIDate),
                ETA: formatSapDate(item.RequestedDeliveryDate),
                CurrentStatus: item.InTransitStatus ?? ''
            }));
        } catch (err) {
            handleError('getSalesOrdersInTransit', err);
        }
    });

    this.on('getOnTimeDelivery', async () => {
        try {
            const rows = await fetchRaw(
                'Z_ON_TIME_DELIVERY_RAW_CDS',
                'Z_ON_TIME_DELIVERY_RAW'
            );

            return rows.map(item => ({
                SalesOrder: item.ReferenceSDDocument ?? '',
                Delivery: item.DeliveryDocument ?? '',
                Customer: item.CustomerName ?? '',
                Material: item.Material ?? '',
                PlannedDeliveryDate: formatSapDate(item.PlannedGoodsIssueDate),
                ActualGIDeliveryDate: formatSapDate(item.ActualGoodsMovementDate),
                Quantity: item.ActualDeliveryQuantity ?? '',
                Plant: item.Plant ?? '',
                ShippingPoint: item.ShippingPoint ?? ''
            }));
        } catch (err) {
            handleError('getOnTimeDelivery', err);
        }
    });

    this.on('getStockShortage', async () => {
        try {
            const rows = await fetchRaw(
                'Z_I_StockShortage_CDS',
                'Z_I_StockShortage'
            );

            return rows.map(item => ({
                Material: item.Material ?? '',
                Plant: item.Plant ?? '',
                StorageLocation: String(item.StorageLocationCount ?? ''),
                AvailableQty: item.TotalWarehouseStock ?? '',
                RequirementQty: item.TotalConsumptionStockQty ?? '',
                ShortageQty: item.TotalStockDecreaseQty ?? '',
                RequirementDate: formatSapDate(item.LatestReqDate) || formatSapDate(item.LastPostingDate),
                MRPController: item.MRPController ?? ''
            }));
        } catch (err) {
            handleError('getStockShortage', err);
        }
    });

    this.on('getPlannedOrderSchedule', async () => {
        try {
            const rows = await fetchRaw(
                'ZI_PLANNEDORDER_CDS',
                'ZI_PlannedOrder'
            );

            return rows.map(item => ({
                PlannedOrder: item.PlannedOrder ?? '',
                Material: item.Material ?? '',
                Plant: item.Plant ?? '',
                BasicStartDate: formatSapDate(item.PlndOrderPlannedStartDate),
                BasicFinishDate: formatSapDate(item.ProductionEndDate),
                ScheduledDate: formatSapDate(item.PlndOrderPlannedStartDate),
                Quantity: item.PlannedQty ?? '',
                Status: item.PlannedOrderType ?? ''
            }));
        } catch (err) {
            handleError('getPlannedOrderSchedule', err);
        }
    });

    this.on('getSalesToPayment', async () => {
        try {
            const rows = await fetchRaw(
                'ZC_ESJI_SALESTOPAY_CDS',
                'ZC_ESJI_SalesToPay'
            );

            return rows.map(item => ({
                SalesOrder: item.SalesOrder ?? '',
                BillingDocument: item.SalesOrderItem ?? '',
                InvoiceDate: formatSapDate(item.InvoiceCreationDate),
                PaymentStatus: item.PaymentMethod ?? '',
                NetAmount: item.InvoiceNetAmount ?? '',
                Customer: item.Customer ?? '',
                DueDate: formatSapDate(item.InvoiceCreationDate),
                ClearingDate: formatSapDate(item.PaymentClearingDate)
            }));
        } catch (err) {
            handleError('getSalesToPayment', err);
        }
    });

this.on('getMaterialVH', async () => {
    try {
        const rows = await fetchRaw('ZI_SALESORDERSINTRANSIT_CDS', 'I_MaterialStdVH', 50);
        return rows.map(item => ({
            Material: item.Material ?? '',
            MaterialDescription: item.Material_Text ?? ''
        }));
    } catch (err) {
        handleError('getMaterialVH', err);
    }
});

this.on('getShippingPointVH', async () => {
    try {
        const rows = await fetchRaw('ZI_SALESORDERSINTRANSIT_CDS', 'I_ShippingPointStdVH', 50);
        return rows.map(item => ({
            ShippingPoint: item.ShippingPoint ?? '',
            ShippingPointDescription: item.ShippingPointName || item.ShippingPoint_Text || ''
        }));
    } catch (err) {
        handleError('getShippingPointVH', err);
    }
});

this.on('getCustomerVH', async () => {
    try {
        const rows = await fetchRaw('ZC_ESJI_SALESTOPAY_CDS', 'I_Customer_VH', 50);
        return rows.map(item => ({
            Customer: item.Customer ?? '',
            CustomerName: item.CustomerName || item.BusinessPartnerName1 || ''
        }));
    } catch (err) {
        handleError('getCustomerVH', err);
    }
});

});