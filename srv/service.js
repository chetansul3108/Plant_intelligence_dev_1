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

async function fetchRaw(serviceName, entityName, top = 10000) {
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
                Route: item.Route ?? '',
                Customer: item.DestCountry ?? '',
                DispatchDate: formatSapDate(item.ActualGoodsMovementDate || item.PlannedGIDate),
                ETA: formatSapDate(item.ETA || item.PlannedGIDate),
                RequestedDeliveryDate: formatSapDate(item.RequestedDeliveryDate),
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
            SalesOrderItem: item.ReferenceSDDocumentItem ?? '',
            Delivery: item.DeliveryDocument ?? '',
            DeliveryItem: item.DeliveryDocumentItem ?? '',
            Customer: item.CustomerName ?? '',
            Material: item.Material ?? '',
            Plant: item.Plant ?? '',
            ShippingPoint: item.ShippingPoint ?? '',

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

            OrderedQty: item.ScheduleLineOrderQuantity ?? '',
            ActualDeliveryQuantity: item.ActualDeliveryQuantity ?? '',
            DeliveredQtyInOrderQtyUnit: item.DeliveredQtyInOrderQtyUnit ?? '',
            OpenReqdDelivQtyInOrdQtyUnit: item.OpenReqdDelivQtyInOrdQtyUnit ?? '',

            RawPlannedGI: formatSapDate(item.PlannedGoodsIssueDate),
            RawItemPlannedGI: formatSapDate(item.ItemPlannedGoodsIssueDate),
            RawActualGI: formatSapDate(item.ActualGoodsMovementDate),
            RawItemActualGI: formatSapDate(item.ItemActualGoodsIssueDate),
            RawRequestedDeliveryDate: formatSapDate(item.RequestedDeliveryDate),
            RawConfirmedDeliveryDate: formatSapDate(item.ConfirmedDeliveryDate)
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

            return rows.map(item => {
                const shortageQty = Number(item.TotalStockDecreaseQty ?? 0);
                const standardPrice = Number(item.StandardPrice ?? 0);

                return {
                    Material: item.Material ?? '',
                    Plant: item.Plant ?? '',
                    StorageLocation: String(item.StorageLocationCount ?? ''),
                    AvailableQty: item.TotalWarehouseStock ?? '',
                    RequirementQty: item.TotalConsumptionStockQty ?? '',
                    ShortageQty: item.TotalStockDecreaseQty ?? '',
                    StandardPrice: String(standardPrice),
                    ShortageValue: String(shortageQty * standardPrice),
                    RequirementDate: formatSapDate(item.LatestReqDate) || formatSapDate(item.LastPostingDate),
                    MRPController: item.MRPController ?? ''
                };
            });
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

        console.log("=== RAW ZI_PlannedOrder first row ===");
        console.log(JSON.stringify(rows[0], null, 2));

        if (rows[0]) {
            console.log("=== RAW ZI_PlannedOrder keys ===");
            console.log(Object.keys(rows[0]));
        }

        return rows.map(item => ({
            PlannedOrder: item.PlannedOrder ?? '',
            Material: item.Material ?? '',
            Plant: item.Plant ?? '',
            BasicStartDate: formatSapDate(item.PlndOrderPlannedStartDate),
            BasicFinishDate: formatSapDate(item.ProductionEndDate),
            ScheduledDate: formatSapDate(item.ConfirmedEndDate),
            ProductionStartDate: formatSapDate(item.ProductionStartDate),
            ActualStartDate: formatSapDate(item.ActualStartDate),
            PlannedQty: item.PlannedQty ?? '',
            ConfirmedQty: item.ConfirmedQty ?? '',
            PlannedOrderType: item.PlannedOrderType ?? '',
            MRPController: item.MRPController ?? '',
            ProductionOrder: item.ProductionOrder ?? '',
            ManufacturingOrder: item.ManufacturingOrder ?? ''
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
                OrderCreationDate: formatSapDate(item.OrderCreationDate),
                GoodsIssueDate: formatSapDate(item.GoodsIssueDate),
                InvoiceDate: formatSapDate(item.InvoiceCreationDate),
                PaymentStatus: item.PaymentMethod ?? '',
                NetAmount: item.InvoiceNetAmount ?? '',
                Customer: item.Customer ?? '',
                DueDate: formatSapDate(item.DueDate),
                ClearingDate: formatSapDate(item.PaymentClearingDate),
                DaysOrderToGI: Number(item.DaysOrderToGI ?? 0),
                DaysGIToInvoice: Number(item.DaysGIToInvoice ?? 0),
                DaysInvoiceToPayment: Number(item.DaysInvoiceToPayment ?? 0)
            }));
        } catch (err) {
            handleError('getSalesToPayment', err);
        }
    });

    this.on('getMaterialVH', async () => {
        try {
            const rows = await fetchRaw(
                'ZI_SALESORDERSINTRANSIT_CDS',
                'I_MaterialStdVH',
                50
            );

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
            const rows = await fetchRaw(
                'ZI_SALESORDERSINTRANSIT_CDS',
                'I_ShippingPointStdVH',
                50
            );

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
            const rows = await fetchRaw(
                'ZC_ESJI_SALESTOPAY_CDS',
                'I_Customer_VH',
                50
            );

            return rows.map(item => ({
                Customer: item.Customer ?? '',
                CustomerName: item.CustomerName || item.BusinessPartnerName1 || ''
            }));
        } catch (err) {
            handleError('getCustomerVH', err);
        }
    });

});