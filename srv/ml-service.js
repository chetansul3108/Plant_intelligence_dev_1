const cds = require('@sap/cds')

module.exports = cds.service.impl(function () {

  this.on('predictStock', async (req) => {
    const payload = {
      month_sin: req.data.month_sin,
      month_cos: req.data.month_cos,
      lag_1: req.data.lag_1,
      lag_2: req.data.lag_2,
      lag_3: req.data.lag_3,
      lag_6: req.data.lag_6,
      rolling_mean_3: req.data.rolling_mean_3,
      rolling_std_3: req.data.rolling_std_3,
      trend: req.data.trend
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/predict/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const err = await response.text()
        return req.error(500, `Stock prediction failed: ${err}`)
      }

      return await response.json()
    } catch (err) {
      return req.error(500, `Could not reach Flask service: ${err.message}`)
    }
  })

  this.on('predictDelivery', async (req) => {
    const payload = {
      ShippingPoint: req.data.ShippingPoint,
      SalesOrganization: req.data.SalesOrganization,
      Plant: req.data.Plant,
      StorageLocation: req.data.StorageLocation,
      SoldToParty: req.data.SoldToParty,
      ShipToParty: req.data.ShipToParty,
      Material: req.data.Material,
      Product: req.data.Product,
      BaseUnit: req.data.BaseUnit,
      MaterialGroup: req.data.MaterialGroup,
      ItemRoute: req.data.ItemRoute,
      DeliveryPriority: req.data.DeliveryPriority,
      ActualDeliveryQuantity: req.data.ActualDeliveryQuantity,
      DeliveryQuantityUnit: req.data.DeliveryQuantityUnit,
      Creation_DayOfWeek: req.data.Creation_DayOfWeek,
      Creation_Month: req.data.Creation_Month,
      Planned_Transit_Days: req.data.Planned_Transit_Days
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/predict/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const err = await response.text()
        return req.error(500, `Delivery prediction failed: ${err}`)
      }

      return await response.json()
    } catch (err) {
      return req.error(500, `Could not reach Flask service: ${err.message}`)
    }
  })

})