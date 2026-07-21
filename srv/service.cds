using { transit.db as db } from '../db/schema';

@path: '/transit-service'
service TransitService {

    entity SalesOrdersInTransit as projection on db.SalesOrdersInTransit;
    entity OnTimeDelivery as projection on db.OnTimeDelivery;
    entity StockShortage as projection on db.StockShortage;
    entity PlannedOrderSchedule as projection on db.PlannedOrderSchedule;
    entity SalesToPayment as projection on db.SalesToPayment;

    entity MaterialVH as projection on db.MaterialVH;
    entity ShippingPointVH as projection on db.ShippingPointVH;
    entity CustomerVH as projection on db.CustomerVH;

    action syncSalesOrdersInTransit() returns String;
    action syncOnTimeDelivery() returns String;
    action syncStockShortage() returns String;
    action syncPlannedOrderSchedule() returns String;
    action syncSalesToPayment() returns String;
    action syncMaterialVH() returns String;
    action syncShippingPointVH() returns String;
    action syncCustomerVH() returns String;
    action syncAllData() returns String;

    action getAISummary(
        kpiName           : String,
        kpiValue          : String,
        unit              : String,
        severity          : String,
        target            : String,
        plant             : String,
        additionalContext : String,
        forecastData      : LargeString
    ) returns AISummaryItem;

    type AISummaryItem {
        title              : String;
        severity           : String;
        summaryText        : LargeString;
        recommendedAction  : LargeString;
        generatedAt        : String;
    }
}