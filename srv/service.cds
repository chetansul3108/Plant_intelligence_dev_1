using { cuid } from '@sap/cds/common';

@path: '/transit-service'
service TransitService {

    action getSalesOrdersInTransit() returns array of SalesOrdersInTransitItem;
    action getOnTimeDelivery() returns array of OnTimeDeliveryItem;
    action getStockShortage() returns array of StockShortageItem;
    action getPlannedOrderSchedule() returns array of PlannedOrderItem;
    action getSalesToPayment() returns array of SalesToPaymentItem;
    action getMaterialVH() returns array of MaterialVHItem;
    action getShippingPointVH() returns array of ShippingPointVHItem;
    action getCustomerVH() returns array of CustomerVHItem;

    type SalesOrdersInTransitItem {
        SalesOrder             : String;
        Delivery               : String;
        Shipment               : String;
        Carrier                : String;
        Route                  : String;
        Customer               : String;
        DispatchDate           : String;
        ETA                    : String;
        RequestedDeliveryDate  : String;
        CurrentStatus          : String;
    }

    type OnTimeDeliveryItem {
        SalesOrder              : String;
        Delivery                : String;
        Customer                : String;
        Material                : String;
        PlannedDeliveryDate     : String;
        ActualGIDeliveryDate    : String;
        Quantity                : String;
        OrderedQty              : String;
        ActualDeliveryQuantity  : String;
        Plant                   : String;
        ShippingPoint           : String;
    }

    type StockShortageItem {
        Material         : String;
        Plant            : String;
        StorageLocation  : String;
        AvailableQty     : String;
        RequirementQty   : String;
        ShortageQty      : String;
        StandardPrice    : String;
        ShortageValue    : String;
        RequirementDate  : String;
        MRPController    : String;
    }

    type PlannedOrderItem {
        PlannedOrder      : String;
        Material          : String;
        Plant             : String;
        BasicStartDate    : String;
        BasicFinishDate   : String;
        ScheduledDate     : String;
        RequiredDate      : String;
        Quantity          : String;
        Status            : String;
    }

    type SalesToPaymentItem {
        SalesOrder            : String;
        BillingDocument       : String;
        OrderCreationDate     : String;
        GoodsIssueDate        : String;
        InvoiceDate           : String;
        PaymentStatus         : String;
        NetAmount             : String;
        Customer              : String;
        DueDate               : String;
        ClearingDate          : String;
        DaysOrderToGI         : Integer;
        DaysGIToInvoice       : Integer;
        DaysInvoiceToPayment  : Integer;
    }

    type MaterialVHItem {
        Material             : String;
        MaterialDescription  : String;
    }

    type ShippingPointVHItem {
        ShippingPoint             : String;
        ShippingPointDescription  : String;
    }

    type CustomerVHItem {
        Customer      : String;
        CustomerName  : String;
    }
        action getAISummary(
        kpiName           : String,
        kpiValue          : String,
        unit              : String,
        severity          : String,
        target            : String,
        plant             : String,
        additionalContext : String,
        forecastData: String
    ) returns AISummaryItem;

    type AISummaryItem {
        title              : String;
        severity           : String;
        summaryText        : String;
        recommendedAction  : String;
        generatedAt        : String;
    }
}