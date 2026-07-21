using { managed } from '@sap/cds/common';

namespace transit.db;

entity SalesOrdersInTransit : managed {
    key SalesOrder             : String(40);
    key Delivery               : String(40);
    key Shipment               : String(40);
        Carrier                : String(100);
        Route                  : String(40);
        Customer               : String(120);
        DispatchDate           : String(20);
        ETA                    : String(20);
        RequestedDeliveryDate  : String(20);
        CurrentStatus          : String(80);
}

entity OnTimeDelivery : managed {
    key SalesOrder             : String(40);
    key Delivery               : String(40);
    key Material               : String(40);
        Customer               : String(120);
        PlannedDeliveryDate    : String(20);
        ActualGIDeliveryDate   : String(20);
        Quantity               : String(40);
        OrderedQty             : String(40);
        ActualDeliveryQuantity : String(40);
        Plant                  : String(20);
        ShippingPoint          : String(20);
}

entity StockShortage : managed {
    key Material               : String(40);
    key Plant                  : String(20);
    key StorageLocation        : String(20);
    key RequirementDate        : String(20);
        AvailableQty           : String(40);
        RequirementQty         : String(40);
        ShortageQty            : String(40);
        StandardPrice          : String(40);
        ShortageValue          : String(40);
        MRPController          : String(20);
}

entity PlannedOrderSchedule : managed {
    key PlannedOrder           : String(40);
    key Material               : String(40);
    key Plant                  : String(20);
        BasicStartDate         : String(20);
        BasicFinishDate        : String(20);
        ScheduledDate          : String(20);
        RequiredDate           : String(20);
        Quantity               : String(40);
        Status                 : String(40);
}

entity SalesToPayment : managed {
    key SalesOrder             : String(40);
    key BillingDocument        : String(40);
        OrderCreationDate      : String(20);
        GoodsIssueDate         : String(20);
        InvoiceDate            : String(20);
        PaymentStatus          : String(40);
        NetAmount              : String(40);
        Customer               : String(120);
        DueDate                : String(20);
        ClearingDate           : String(20);
        DaysOrderToGI          : Integer;
        DaysGIToInvoice        : Integer;
        DaysInvoiceToPayment   : Integer;
}

entity MaterialVH : managed {
    key Material               : String(40);
        MaterialDescription    : String(255);
}

entity ShippingPointVH : managed {
    key ShippingPoint              : String(20);
        ShippingPointDescription   : String(255);
}

entity CustomerVH : managed {
    key Customer               : String(40);
        CustomerName           : String(255);
}