sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Element",
    "sap/ui/core/Fragment",
    "plant_intelligence_dev/formatter/kpiformatter"
], function (Controller, JSONModel, BusyDialog, MessageToast, MessageBox, Element, Fragment, kpiformatter) {
    "use strict";
 
    return Controller.extend("plant_intelligence_dev.controller.Main", {
        formatter: kpiformatter,
 
        onInit: function () {
            this.getView().setModel(new JSONModel({
                selectedWrapperClass: "",
selectedTileClass: "",
    hasSelectionClass: "",
    showInsight: false,
    showEmpty: true,
    selectedInsight: {
        hasSelection: false,
        key: "",
        subtitle: "Real-time performance across all plants",
        title: "",
        text: "",
        icon: "",
        iconClass: "",
        recommendation: ""
    },
                cards: [
                    {
                        key: "onTimeDelivery",
                        title: "ON-TIME DELIVERY",
                        value: "0.0",
                        unit: "%",
                        delta: "Loading...",
                        footerLeft: "",
                        footerRight: "Target ≥95%",
                        statusText: "ON TRACK",
                        statusState: "Success",
                        accentClass: "accentGreen",
                        iconClass: "iconGreen",
                        deltaClass: "deltaGreen",
                        chartClass: "chartGreen",
                        selectedClass: "",
                        action: "getOnTimeDelivery",
                        forecastType: "delivery",
                        hasForecast: true,
                        lineBreak: true,
                        isSelected: "false",
                    },
                    {
                        key: "orderLifecycle",
                        title: "ORDER LIFECYCLE DAYS",
                        value: "0.0",
                        unit: "d",
                        delta: "Loading...",
                        footerLeft: "",
                        footerRight: "Target ≤5 days",
                        statusText: "MONITOR",
                        statusState: "Warning",
                        accentClass: "accentAmber",
                        iconClass: "iconAmber",
                        deltaClass: "deltaRed",
                        chartClass: "chartAmber",
                        selectedClass: "",
                        action: "getSalesToPayment",
                        forecastType: "delivery",
                        lineBreak: false,
                        hasForecast: false,
                        isSelected: "false",
                    },
                    {
                        key: "otif",
                        title: "OTIF %",
                        value: "0.0",
                        unit: "%",
                        delta: "Loading...",
                        footerLeft: "",
                        footerRight: "Target ≥95%",
                        statusText: "ON TRACK",
                        statusState: "Success",
                        accentClass: "accentGreen",
                        iconClass: "iconGreen",
                        deltaClass: "deltaGreen",
                        chartClass: "chartGreen",
                        selectedClass: "",
                        action: "getOnTimeDelivery",
                        forecastType: "delivery",
                        lineBreak: true,
                        hasForecast: false,
                        isSelected: "false",
                    },
                    {
                        key: "stockShortage",
                        title: "STOCK SHORTAGE COUNT",
                        value: "0",
                        unit: "",
                        delta: "Loading...",
                        footerLeft: "",
                        footerRight: "8 order-impacting",
                        statusText: "CRITICAL",
                        statusState: "Error",
                        accentClass: "accentRed",
                        iconClass: "iconRed",
                        deltaClass: "deltaRed",
                        chartClass: "chartRed",
                        selectedClass: "",
                        action: "getStockShortage",
                        forecastType: "stock",
                        hasForecast: true,
                        lineBreak: false,
                        isSelected: "false",
                    },
                    {
                        key: "scheduleRisk",
                        title: "SCHEDULE RISK ORDERS",
                        value: "0",
                        unit: "",
                        delta: "Loading...",
                        footerLeft: "",
                        footerRight: "5 >2 day delays",
                        statusText: "MONITOR",
                        statusState: "Warning",
                        accentClass: "accentAmber",
                        iconClass: "iconAmber",
                        deltaClass: "deltaAmber",
                        chartClass: "chartAmber",
                        selectedClass: "",
                        action: "getPlannedOrderSchedule",
                        forecastType: "delivery",
                        lineBreak: true,
                        hasForecast: false,
                        isSelected: "false",
                    },
                    {
                        key: "transitRisk",
                        title: "TRANSIT RISK ORDERS",
                        value: "0",
                        unit: "",
                        delta: "Loading...",
                        footerLeft: "",
                        footerRight: "3 priority customers",
                        statusText: "WATCH",
                        statusState: "Information",
                        accentClass: "accentBlue",
                        iconClass: "iconBlue",
                        deltaClass: "deltaRed",
                        chartClass: "chartBlue",
                        selectedClass: "",
                        action: "getSalesOrdersInTransit",
                        forecastType: "delivery",
                        lineBreak: false,
                        hasForecast: false,
                        isSelected: "false",
                    }
                ]
            }), "dashboardModel");
 
            this._insightMeta = {
                onTimeDelivery: {
                    icon: "sap-icon://truck",
                    iconClassGood: "iconGreen",
                    iconClassBad: "iconRed",
                    recommendationGood: "Maintain current dispatch schedule; monitor plants trending below target.",
                    recommendationBad: "Investigate carriers and plants driving missed delivery windows."
                },
                orderLifecycle: {
                    icon: "sap-icon://process",
                    iconClassGood: "iconGreen",
                    iconClassBad: "iconAmber",
                    recommendationGood: "Lifecycle time is within target; continue current process cadence.",
                    recommendationBad: "Investigate bottlenecks between order creation and invoicing."
                },
                otif: {
                    icon: "sap-icon://shipping-status",
                    iconClassGood: "iconGreen",
                    iconClassBad: "iconAmber",
                    recommendationGood: "OTIF performance is on target; keep monitoring priority accounts.",
                    recommendationBad: "Prioritize delivery reliability and fill-rate improvements this week."
                },
                stockShortage: {
                    icon: "sap-icon://alert",
                    iconClassGood: "iconGreen",
                    iconClassBad: "iconRed",
                    recommendationGood: "Shortage levels are under control; continue current replenishment cycle.",
                    recommendationBad: "Expedite replenishment for the plants driving the highest shortage value."
                },
                scheduleRisk: {
                    icon: "sap-icon://alert",
                    iconClassGood: "iconGreen",
                    iconClassBad: "iconAmber",
                    recommendationGood: "Schedule adherence is healthy across plants.",
                    recommendationBad: "Review planning schedules for orders with confirmed-quantity shortfalls."
                },
                transitRisk: {
                    icon: "sap-icon://shipping-status",
                    iconClassGood: "iconGreen",
                    iconClassBad: "iconBlue",
                    recommendationGood: "Transit performance is on track; no action needed.",
                    recommendationBad: "Proactively notify priority customers about expected delays."
                }
            };
 
            this._autoRefreshInterval = 5 * 60 * 1000;
            this._loadAllCards();
            this._startAutoRefresh();
        },
 
        onAfterRendering: function () {
            var $wrappers = this.getView().$().find(".kpiCardWrapper");
            $wrappers.off("click.kpiCard").on("click.kpiCard", this._onKpiCardClick.bind(this));
        },
 
        onExit: function () {
            if (this._refreshTimer) {
                clearInterval(this._refreshTimer);
                this._refreshTimer = null;
            }
        },
 
        _startAutoRefresh: function () {
            if (this._refreshTimer) {
                clearInterval(this._refreshTimer);
            }
 
            this._refreshTimer = setInterval(function () {
                this._loadAllCards(false);
            }.bind(this), this._autoRefreshInterval);
        },
 
        _getCurrentTimeText: function () {
            var oNow = new Date();
            var sHours = String(oNow.getHours()).padStart(2, "0");
            var sMinutes = String(oNow.getMinutes()).padStart(2, "0");
            return sHours + ":" + sMinutes + " today";
        },
 
        // Simple deterministic pseudo-random generator so the same Material
        // always gets the same dummy StandardPrice across refreshes/plants.
        _seededRandom: function (sSeed) {
            var nHash = 0;
            for (var i = 0; i < sSeed.length; i++) {
                nHash = (nHash << 5) - nHash + sSeed.charCodeAt(i);
                nHash |= 0;
            }
            var nX = Math.sin(nHash) * 10000;
            return nX - Math.floor(nX);
        },
 
        // Aggregates raw movement-level rows (from the OData export) into one
        // row per Material-Plant, adding dummy ShortageQty / StandardPrice
        // fields since the source table has neither.
        _buildShortageKpiFromRawRows: function (aRawRows) {
            var oAgg = {};
 
            aRawRows.forEach(function (oRow) {
                var sKey = oRow.Material + "||" + oRow.Plant;
                if (!oAgg[sKey]) {
                    oAgg[sKey] = {
                        Material: oRow.Material,
                        Plant: oRow.Plant,
                        CompanyCode: oRow.CompanyCode,
                        BaseUnit: oRow.BaseUnit,
                        RecordCount: 0
                    };
                }
                oAgg[sKey].RecordCount++;
            });
 
            var oMaterialPrices = {};
 
            return Object.keys(oAgg).map(function (sKey) {
                var oItem = oAgg[sKey];
 
                if (!oMaterialPrices[oItem.Material]) {
                    oMaterialPrices[oItem.Material] =
                        Math.round((10 + this._seededRandom(oItem.Material) * 490) * 100) / 100;
                }
 
                var nShortageQty = Math.round(
                    (5 + this._seededRandom(sKey + "|qty") * 995) * 100
                ) / 100;
                var nStandardPrice = oMaterialPrices[oItem.Material];
 
                return {
                    Material: oItem.Material,
                    Plant: oItem.Plant,
                    CompanyCode: oItem.CompanyCode,
                    BaseUnit: oItem.BaseUnit,
                    ShortageQty: nShortageQty,
                    StandardPrice: nStandardPrice,
                    Currency: "USD",
                    ShortageValue: Math.round(nShortageQty * nStandardPrice * 100) / 100
                };
            }.bind(this));
        },
 
        _fetchLocalStockShortageData: async function () {
            try {
                var sUrl = sap.ui.require.toUrl("plant_intelligence_dev/model/shortageKPI.json");
                var response = await fetch(sUrl);
 
                if (!response.ok) {
                    throw new Error("HTTP " + response.status + " loading download.json");
                }
 
                var data = await response.json();
 
                // Pre-aggregated KPI shape: { ShortageKPI: { Items: [...] } }
                if (data && data.ShortageKPI && Array.isArray(data.ShortageKPI.Items)) {
                    return data.ShortageKPI.Items;
                }
 
                // Raw OData export shape: { d: { results: [...] } } — aggregate
                // by Material-Plant and add dummy ShortageQty/StandardPrice.
                if (data && data.d && Array.isArray(data.d.results)) {
                    return this._buildShortageKpiFromRawRows(data.d.results);
                }
 
                if (Array.isArray(data)) {
                    // Could already be a flat array of shortage items, or raw rows.
                    var bHasShortageFields = data.length > 0 &&
                        data[0].ShortageQty !== undefined && data[0].StandardPrice !== undefined;
                    return bHasShortageFields ? data : this._buildShortageKpiFromRawRows(data);
                }
 
                return [];
            } catch (err) {
                MessageToast.show("Error loading download.json: " + err.message);
                return [];
            }
        },
 
        _fetchLocalPlannedOrderData: async function () {
            try {
                var sUrl = sap.ui.require.toUrl("plant_intelligence_dev/model/plannedOrderSchedule.json");
                var response = await fetch(sUrl);
 
                if (!response.ok) {
                    throw new Error("HTTP " + response.status + " loading plannedOrderSchedule.json");
                }
 
                var data = await response.json();
 
                if (data && data.d && Array.isArray(data.d.results)) {
                    return data.d.results;
                }
 
                return Array.isArray(data) ? data : [];
            } catch (err) {
                MessageToast.show("Error loading plannedOrderSchedule.json: " + err.message);
                return [];
            }
        },
 
        _fetchData: async function (action, bShowBusy) {
            var oBusyDialog = null;
 
            if (bShowBusy) {
                oBusyDialog = new BusyDialog({ text: "Loading..." });
                oBusyDialog.open();
            }
 
            if (action === "getStockShortage") {
                var aLocalResults = await this._fetchLocalStockShortageData();
 
                if (oBusyDialog) {
                    oBusyDialog.close();
                }
 
                return aLocalResults;
            }
 
            if (action === "getPlannedOrderSchedule") {
                var aLocalPlannedOrders = await this._fetchLocalPlannedOrderData();
 
                if (oBusyDialog) {
                    oBusyDialog.close();
                }
 
                return aLocalPlannedOrders;
            }
 
            try {
                var response = await fetch("/transit-service/" + action, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({})
                });
 
                var contentType = response.headers.get("content-type") || "";
                if (!response.ok || !contentType.includes("application/json")) {
                    var text = await response.text();
                    throw new Error("HTTP " + response.status + ": " + text);
                }
 
                var data = await response.json();
                return data.value || [];
            } catch (err) {
                MessageToast.show("Error: " + err.message);
                return [];
            } finally {
                if (oBusyDialog) {
                    oBusyDialog.close();
                }
            }
        },
 
        _toDate: function (v) {
            if (!v) {
                return null;
            }
 
            if (typeof v === "string" && v.startsWith("/Date(")) {
                var m = v.match(/\/Date\((\d+)\)\//);
                if (m) {
                    return new Date(Number(m[1]));
                }
            }
 
            var d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
        },
 
        _toNumber: function (v) {
            var n = parseFloat(v);
            return isNaN(n) ? 0 : n;
        },
 
        _daysBetween: function (d1, d2) {
            if (!d1 || !d2) {
                return null;
            }
            return (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
        },
 
        _calculateCardMetrics: function (sKey, aResults) {
            var sValue = "0";
            var sDelta = "0 records loaded";
 
            if (!Array.isArray(aResults) || aResults.length === 0) {
                return {
                    value: "0",
                    delta: "0 records loaded"
                };
            }
 
            switch (sKey) {
                case "orderLifecycle": {
                    var aValidLifecycle = aResults.map(function (oRow) {
                        var dStart = this._toDate(oRow.OrderCreationDate);
                        var dEnd = this._toDate(oRow.InvoiceDate);
 
                        if (!dStart || !dEnd) {
                            return null;
                        }
 
                        var nDays = this._daysBetween(dStart, dEnd);
                        return nDays !== null && nDays >= 0 ? nDays : null;
                    }.bind(this)).filter(function (nDays) {
                        return nDays !== null;
                    });
 
                    var nTotalLifecycle = aValidLifecycle.reduce(function (sum, nDays) {
                        return sum + nDays;
                    }, 0);
 
                    var nAvgLifecycle = aValidLifecycle.length ? (nTotalLifecycle / aValidLifecycle.length) : 0;
 
                    sValue = nAvgLifecycle.toFixed(1);
                    sDelta = aValidLifecycle.length + " lifecycle records measured";
                    break;
                }
 
                case "onTimeDelivery": {
                    var aValidDelivery = aResults.filter(function (oRow) {
                        return !!this._toDate(oRow.PlannedDeliveryDate) &&
                               !!this._toDate(oRow.ActualGIDeliveryDate);
                    }.bind(this));
 
                    var iTotalDelivery = aValidDelivery.length;
 
                    var iOnTime = aValidDelivery.filter(function (oRow) {
                        var dPlanned = this._toDate(oRow.PlannedDeliveryDate);
                        var dActual = this._toDate(oRow.ActualGIDeliveryDate);
                        return dActual.getTime() <= dPlanned.getTime();
                    }.bind(this)).length;
 
                    var nPctDelivery = iTotalDelivery ? (iOnTime / iTotalDelivery) * 100 : 0;
 
                    sValue = nPctDelivery.toFixed(1);
                    sDelta = iOnTime + " on-time of " + iTotalDelivery + " valid deliveries";
                    break;
                }
 
                case "otif": {
                    var aValidOtif = aResults.filter(function (oRow) {
                        return !!this._toDate(oRow.PlannedDeliveryDate) &&
                               !!this._toDate(oRow.ActualGIDeliveryDate) &&
                               this._toNumber(oRow.OrderedQty) > 0 &&
                               this._toNumber(oRow.ActualDeliveryQuantity) > 0;
                    }.bind(this));
 
                    var iTotalOtif = aValidOtif.length;
 
                    var iOtif = aValidOtif.filter(function (oRow) {
                        var dPlanned = this._toDate(oRow.PlannedDeliveryDate);
                        var dActual = this._toDate(oRow.ActualGIDeliveryDate);
                        var bOnTime = dActual.getTime() <= dPlanned.getTime();
 
                        var nOrdered = this._toNumber(oRow.OrderedQty);
                        var nDelivered = this._toNumber(oRow.ActualDeliveryQuantity);
                        var bInFull = nDelivered >= nOrdered;
 
                        return bOnTime && bInFull;
                    }.bind(this)).length;
 
                    var nPctOtif = iTotalOtif ? (iOtif / iTotalOtif) * 100 : 0;
 
                    sValue = nPctOtif.toFixed(1);
                    sDelta = iOtif + " OTIF of " + iTotalOtif + " valid deliveries";
                    break;
                }
 
                case "stockShortage": {
                    var iCount = aResults.length;
 
                    var nShortageValue = aResults.reduce(function (sum, oRow) {
                        var nQty = this._toNumber(oRow.ShortageQty);
                        var nPrice = this._toNumber(oRow.StandardPrice);
                        return sum + (nQty * nPrice);
                    }.bind(this), 0);
 
                    var sFormattedValue = (nShortageValue / 1000000).toFixed(2) + "M";
 
                    sValue = String(iCount);
                    sDelta = "Shortage value $" + sFormattedValue;
                    break;
                }
 
                case "scheduleRisk": {
                    var aRiskSchedule = aResults.filter(function (oRow) {
                        var dRequired = this._toDate(oRow.RequiredFinishDate);
                        var dScheduledFinish = this._toDate(oRow.ScheduledFinishDate);
                        var sStatus = oRow.ReleaseStatus;
 
                        var bLateFinish = dRequired && dScheduledFinish &&
                            dScheduledFinish.getTime() > dRequired.getTime();
                        var bNotReleased = sStatus !== "Released";
 
                        return bLateFinish || bNotReleased;
                    }.bind(this));
 
                    var aDelayDays = aRiskSchedule.map(function (oRow) {
                        var dRequired = this._toDate(oRow.RequiredFinishDate);
                        var dScheduledFinish = this._toDate(oRow.ScheduledFinishDate);
 
                        if (!dRequired || !dScheduledFinish) {
                            return null;
                        }
 
                        if (dScheduledFinish.getTime() <= dRequired.getTime()) {
                            return null;
                        }
 
                        return this._daysBetween(dRequired, dScheduledFinish);
                    }.bind(this)).filter(function (nDays) {
                        return nDays !== null && nDays > 0;
                    });
 
                    var nAvgDelay = aDelayDays.length
                        ? aDelayDays.reduce(function (sum, nDays) {
                            return sum + nDays;
                        }, 0) / aDelayDays.length
                        : null;
 
                    sValue = String(aRiskSchedule.length);
                    sDelta = nAvgDelay !== null ? "Avg " + nAvgDelay.toFixed(1) + " day delay" : "Avg delay N/A";
                    break;
                }
 
                case "transitRisk": {
                    var aRiskTransit = aResults.filter(function (oRow) {
                        var dEta = this._toDate(oRow.ETA);
                        var dRequested = this._toDate(oRow.RequestedDeliveryDate);
                        return dEta && dRequested && dEta.getTime() > dRequested.getTime();
                    }.bind(this));
 
                    var aDelayedDaysTransit = aRiskTransit.map(function (oRow) {
                        var dEta = this._toDate(oRow.ETA);
                        var dRequested = this._toDate(oRow.RequestedDeliveryDate);
                        return this._daysBetween(dRequested, dEta);
                    }.bind(this)).filter(function (nDays) {
                        return nDays !== null && nDays > 0;
                    });
 
                    var nAvgTransitDelay = aDelayedDaysTransit.length
                        ? aDelayedDaysTransit.reduce(function (a, b) {
                            return a + b;
                        }, 0) / aDelayedDaysTransit.length
                        : 0;
 
                    sValue = String(aRiskTransit.length);
                    sDelta = aRiskTransit.length
                        ? "ETA delayed avg " + nAvgTransitDelay.toFixed(1) + " days"
                        : "No delayed transit orders";
                    break;
                }
 
                default:
                    sValue = String(aResults.length);
                    sDelta = aResults.length + " records loaded";
                    break;
            }
 
            return {
                value: sValue,
                delta: sDelta
            };
        },
 
        _loadCardByIndex: async function (iIndex, bShowBusy) {
            var oModel = this.getView().getModel("dashboardModel");
            var oCard = oModel.getProperty("/cards/" + iIndex);
 
            if (!oCard) {
                return;
            }
 
            var aResults = await this._fetchData(oCard.action, bShowBusy);
            var oMetrics = this._calculateCardMetrics(oCard.key, aResults);
            var sStatusText = kpiformatter.getTargetStatusText(oCard.key, oMetrics.value);
            var sStatusState = kpiformatter.getTargetStatusState(oCard.key, oMetrics.value);
 
            oModel.setProperty("/cards/" + iIndex + "/value", oMetrics.value);
            oModel.setProperty("/cards/" + iIndex + "/delta", oMetrics.delta);
            oModel.setProperty("/cards/" + iIndex + "/footerLeft", this._getCurrentTimeText());
            oModel.setProperty("/cards/" + iIndex + "/statusText", sStatusText);
            oModel.setProperty("/cards/" + iIndex + "/statusState", sStatusState);
 
            var sSelectedKey = oModel.getProperty("/selectedInsight/key");
            if (sSelectedKey === oCard.key) {
                this._showInsightForKey(oCard.key);
            }
        },
 
        _loadAllCards: async function (bShowBusy) {
            var oModel = this.getView().getModel("dashboardModel");
            var aCards = oModel.getProperty("/cards") || [];
            var bBusy = bShowBusy !== false;
 
            if (bBusy) {
                var oBusyDialog = new BusyDialog({ text: "Loading dashboard..." });
                oBusyDialog.open();
 
                try {
                    await Promise.all(aCards.map(function (oCard, iIndex) {
                        return this._loadCardByIndex(iIndex, false);
                    }.bind(this)));
                } finally {
                    oBusyDialog.close();
                }
 
                return;
            }
 
            await Promise.all(aCards.map(function (oCard, iIndex) {
                return this._loadCardByIndex(iIndex, false);
            }.bind(this)));
        },
 
        onCardPress: async function (oEvent) {
            var sKey = oEvent.getSource().data("cardKey");
            var oModel = this.getView().getModel("dashboardModel");
            var aCards = oModel.getProperty("/cards");
            var iIndex = aCards.findIndex(function (oCard) {
                return oCard.key === sKey;
            });
 
            if (iIndex === -1) {
                return;
            }
 
            await this._loadCardByIndex(iIndex, true);
        },
 
        onRefreshDashboard: async function () {
            await this._loadAllCards(true);
        },
 
        _onKpiCardClick: async function (oEvent) {
    // Ignore clicks that originated on the Forecast button — it has its
    // own press handler and shouldn't also trigger card selection/insight.
    if (jQuery(oEvent.target).closest(".forecastTrigger").length) {
        return;
    }

    var oDomRef = oEvent.currentTarget;
    var oControl = Element.closestTo(oDomRef);
 
    if (!oControl) {
        return;
    }
 
    var aCustomData = oControl.getCustomData();
    if (!aCustomData || !aCustomData.length) {
        return;
    }
 
    var sKey = aCustomData[0].getValue();
    await this._showInsightForKey(sKey);
},
       _fetchAISummary: async function (oCard, oForecastData) {
    console.log("Fetching AI summary for card:", oCard, "forecast:", oForecastData);
    try {
        const response = await fetch("/transit-service/getAISummary", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                kpiName: oCard.title || "",
                kpiValue: String(oCard.value || ""),
                unit: oCard.unit || "",
                severity: oCard.statusText || "",
                target: oCard.footerRight || "",
                plant: "All Plants",
                additionalContext: oCard.delta || "",
                // stringified because CDS action params are simple types (String)
                forecastData: oForecastData ? JSON.stringify(oForecastData) : ""
            })
        });

        const contentType = response.headers.get("content-type") || "";
        if (!response.ok || !contentType.includes("application/json")) {
            const text = await response.text();
            throw new Error("HTTP " + response.status + ": " + text);
        }

        const data = await response.json();
        return data.value || data;
    } catch (err) {
        console.error("AI summary fetch failed:", err);
        throw err;
    }
},
 
_showInsightForKey: async function (sKey) {
    var oModel = this.getView().getModel("dashboardModel");
    var aCards = oModel.getProperty("/cards");
    var oCard = aCards.find(function (c) {
        return c.key === sKey;
    });
    var oMeta = this._insightMeta[sKey];

    if (!oCard || !oMeta) {
        return;
    }

    aCards.forEach(function (c) {
        c.isSelected = (c.key === sKey) ? "true" : "false";
    });
    oModel.setProperty("/cards", aCards);

    oModel.setProperty("/selectedInsight/hasSelection", true);
    oModel.setProperty("/selectedInsight/key", sKey);
    oModel.setProperty("/selectedInsight/subtitle", "Generating AI insight...");
    oModel.setProperty("/selectedInsight/title", oCard.title);
    oModel.setProperty("/selectedInsight/text", "Please wait while AI summary is being generated.");
    oModel.setProperty("/selectedInsight/icon", oMeta.icon);
    oModel.setProperty("/selectedInsight/iconClass", oMeta.iconClassBad);
    oModel.setProperty("/selectedInsight/recommendation", "");
    oModel.setProperty("/showInsight", true);
    oModel.setProperty("/showEmpty", false);
    oModel.setProperty("/hasSelectionClass", "hasSelection");
    oModel.refresh(true);

    try {
        // Fetch the ML forecast first (best-effort — returns null on failure
        // or if the card has no forecast), then pass it into the AI summary
        // call so the LLM can reason about current KPI + predicted trend together.
        var oForecastData = await this._fetchForecastForCard(oCard);
        var oAiSummary = await this._fetchAISummary(oCard, oForecastData);

        oModel.setProperty("/selectedInsight/subtitle", "Insight for selected KPI");
        oModel.setProperty("/selectedInsight/title", oAiSummary.title || (oCard.title + " — " + oCard.statusText));
        oModel.setProperty("/selectedInsight/text", oAiSummary.summaryText || "No summary generated.");
        oModel.setProperty("/selectedInsight/recommendation", oAiSummary.recommendedAction || "");
        oModel.setProperty("/selectedInsight/icon", oMeta.icon);

        if ((oAiSummary.severity || "").toUpperCase() === "CRITICAL") {
            oModel.setProperty("/selectedInsight/iconClass", "iconRed");
        } else if ((oAiSummary.severity || "").toUpperCase() === "WATCH" || (oAiSummary.severity || "").toUpperCase() === "MONITOR") {
            oModel.setProperty("/selectedInsight/iconClass", "iconAmber");
        } else {
            oModel.setProperty("/selectedInsight/iconClass", "iconGreen");
        }
    } catch (err) {
        var bIsGood = oCard.statusState === "Success";
        var sFallbackRecommendation = bIsGood ? oMeta.recommendationGood : oMeta.recommendationBad;
        var sFallbackText = oCard.title + " is currently " + oCard.value + oCard.unit +
            " (" + oCard.delta + "). " + oCard.footerRight + ".";

        oModel.setProperty("/selectedInsight/subtitle", "Insight for selected KPI");
        oModel.setProperty("/selectedInsight/title", oCard.title + " — " + oCard.statusText);
        oModel.setProperty("/selectedInsight/text", sFallbackText);
        oModel.setProperty("/selectedInsight/recommendation", sFallbackRecommendation);
        oModel.setProperty("/selectedInsight.icon", oMeta.icon);
        oModel.setProperty("/selectedInsight/iconClass", bIsGood ? oMeta.iconClassGood : oMeta.iconClassBad);

        console.warn("AI summary unavailable. Using fallback insight.", err);
    }

    oModel.refresh(true);
},

        // ===================== FORECAST (MLService) =====================

        onForecastPress: async function (oEvent) {
            var sKey = oEvent.getSource().data("cardKey");
            var oModel = this.getView().getModel("dashboardModel");
            var aCards = oModel.getProperty("/cards");
            var oCard = aCards.find(function (c) {
                return c.key === sKey;
            });

            if (!oCard) {
                return;
            }

            var oBusyDialog = new BusyDialog({ text: "Generating forecast..." });
            oBusyDialog.open();

            try {
                var oResult;

                if (oCard.forecastType === "stock") {
                    oResult = await this._fetchForecast("predictStock", this._buildStockPayload(oCard));
                } else {
                    oResult = await this._fetchForecast("predictDelivery", this._buildDeliveryPayload(oCard));
                }

                this._showForecastDialog(oResult, oCard.forecastType);
            } catch (err) {
                MessageBox.error("Forecast failed: " + err.message);
            } finally {
                oBusyDialog.close();
            }
        },

        _fetchForecast: async function (sAction, oPayload) {
            var response = await fetch("/odata/v4/ml/" + sAction, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oPayload)
            });

            var contentType = response.headers.get("content-type") || "";
            if (!response.ok || !contentType.includes("application/json")) {
                var text = await response.text();
                throw new Error("HTTP " + response.status + ": " + text);
            }

            var data = await response.json();
            console.log("Forecast response data:", data);
            return data.value || data;
        },

        // NOTE: placeholder payload — replace with real bound feature values
        // (month_sin/cos, lag_1..lag_6, rolling_mean_3, rolling_std_3, trend)
        // once those are available on the card/data model.
        _buildStockPayload: function (oCard) {
            var oNow = new Date();
            var nMonth = oNow.getMonth() + 1;
            var nBase = this._toNumber(oCard.value) || 50;

            return {
               month_sin: 0.50,
    month_sin: 0.50,
  month_cos: 0.87,

  lag_1: 4.2,
  lag_2: 4.1,
  lag_3: 4.0,
  lag_6: 3.9,

  rolling_mean_3: 4.1,
  rolling_std_3: 0.12,

  trend: 1.2
            };
        },

        // NOTE: placeholder payload — replace with real bound feature values
        // (ShippingPoint, Plant, Material, etc.) once those are available on
        // the card/data model.
        _buildDeliveryPayload: function (oCard) {
            var oNow = new Date();

            return {
                ShippingPoint: "1000",
                SalesOrganization: "1000",
                Plant: "1000",
                StorageLocation: "0001",
                SoldToParty: "1000",
                ShipToParty: "1000",
                Material: "MAT001",
                Product: "MAT001",
                BaseUnit: "EA",
                MaterialGroup: "GRP01",
                ItemRoute: "R001",
                DeliveryPriority: "02",
                ActualDeliveryQuantity: this._toNumber(oCard.value) || 100,
                DeliveryQuantityUnit: "EA",
                Creation_DayOfWeek: oNow.getDay(),
                Creation_Month: oNow.getMonth() + 1,
                Planned_Transit_Days: 3
            };
        },

        _showForecastDialog: function (oResult, sType) {
    var oView = this.getView();

    // ✅ SWITCH FRAGMENT BASED ON TYPE
    var sFragmentName = sType === "stock"
        ? "plant_intelligence_dev.fragment.StockForecastDialog"
        : "plant_intelligence_dev.fragment.DeliveryForecastDialog";

    Fragment.load({
        id: oView.getId(),
        name: sFragmentName,
        controller: this
    }).then(function (oDialog) {

        let oData = {};

        // ✅ STOCK LOGIC
        if (sType === "stock") {
            var iShortage = Number(oResult?.prediction ?? 0);

            oData = {
                prediction: iShortage.toFixed(2),
                statusText: iShortage > 0 ? "Shortage Expected" : "No Shortage",
                statusState: iShortage > 0 ? "Error" : "Success",
                messageText: iShortage > 0
                    ? "Potential stock shortage detected. Replenishment required."
                    : "No shortage expected. Stock levels are sufficient.",
                messageType: iShortage > 0 ? "Error" : "Success"
            };
        }

        // ✅ DELIVERY LOGIC (NEW)
        if (sType === "delivery") {
            var fDelay = Number(oResult?.prediction_delay_days ?? 0);

            oData = {
                prediction_delay_days: fDelay.toFixed(1),
                statusText: fDelay > 2 ? "High Delay Risk" : "On-Time Delivery",
                statusState: fDelay > 2 ? "Error" : "Success",
                messageText: fDelay > 2
                    ? "High delay expected. Take action."
                    : "Delivery is on track.",
                messageType: fDelay > 2 ? "Error" : "Success"
            };
        }

        console.log("✅ FINAL DATA:", oData);

        var oModel = new sap.ui.model.json.JSONModel(oData);
        oDialog.setModel(oModel, "forecast");

        oView.addDependent(oDialog);
        oDialog.open();
    });
},

        onForecastDialogClose: function (oEvent) {
    var oDialog = oEvent.getSource().getParent();
    oDialog.close();
    oDialog.destroy(); // IMPORTANT (prevents duplicate dialogs)
},
// NEW: builds the ML payload + calls the right predict action, returns a
// normalized forecast object (or null if forecast isn't available/fails).
_fetchForecastForCard: async function (oCard) {
    if (!oCard.hasForecast) {
        return null;
    }

    try {
        var sAction = oCard.forecastType === "stock" ? "predictStock" : "predictDelivery";
        var oPayload = oCard.forecastType === "stock"
            ? this._buildStockPayload(oCard)
            : this._buildDeliveryPayload(oCard);

        var oResult = await this._fetchForecast(sAction, oPayload);

        if (oCard.forecastType === "stock") {
            var nShortage = Number(oResult?.prediction ?? 0);
            return {
                type: "stock",
                predictedShortageQty: Number(nShortage.toFixed(2)),
                riskLevel: nShortage > 0 ? "Shortage Expected" : "No Shortage"
            };
        }

        var nDelay = Number(oResult?.prediction_delay_days ?? 0);
        return {
            type: "delivery",
            predictedDelayDays: Number(nDelay.toFixed(1)),
            riskLevel: nDelay > 2 ? "High Delay Risk" : "On-Time Delivery"
        };
    } catch (err) {
        // Forecast is best-effort — AI summary should still work without it.
        console.warn("Forecast unavailable for AI summary:", err.message);
        return null;
    }
},
    });
});