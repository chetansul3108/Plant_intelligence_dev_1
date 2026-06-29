service PlantService {

    action getTransitData() returns many TransitData;

    type TransitData {
        SalesOrder              : String;
        SalesOrderItem          : String;
        Material                : String;
        ProductionPlant         : String;
        DeliveryStatus          : String;
        InTransitStatus         : String;
        DeliveryDocument        : String;
        TransitDelayDays        : Integer;
    }

}