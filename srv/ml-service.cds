service MLService {
  action predictStock(
    month_sin : Decimal,
    month_cos : Decimal,
    lag_1 : Decimal,
    lag_2 : Decimal,
    lag_3 : Decimal,
    lag_6 : Decimal,
    rolling_mean_3 : Decimal,
    rolling_std_3 : Decimal,
    trend : Integer
  ) returns StockPrediction;

  action predictDelivery(
    ShippingPoint : String,
    SalesOrganization : String,
    Plant : String,
    StorageLocation : String,
    SoldToParty : String,
    ShipToParty : String,
    Material : String,
    Product : String,
    BaseUnit : String,
    MaterialGroup : String,
    ItemRoute : String,
    DeliveryPriority : String,
    ActualDeliveryQuantity : Decimal,
    DeliveryQuantityUnit : String,
    Creation_DayOfWeek : Integer,
    Creation_Month : Integer,
    Planned_Transit_Days : Integer
  ) returns DeliveryPrediction;
}

type StockPrediction {
  model : String;
  prediction : Decimal;
}

type DeliveryPrediction {
  model : String;
  prediction_delay_days : Decimal;
  risk_status : String;
}