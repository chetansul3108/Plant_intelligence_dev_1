sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog",
    "sap/m/MessageToast",
    "sap/ui/core/Element",
    "plant_intelligence_dev/formatter/kpiformatter"
], function (Controller, JSONModel, BusyDialog, MessageToast, Element, kpiformatter) {
    "use strict";
 
    return Controller.extend("plant_intelligence_dev.controller.Main", {
        formatter: kpiformatter,
 
        onInit: function () {
            this.getView().setModel(new JSONModel({
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
                        lineBreak: true
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
                        lineBreak: false
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
                        lineBreak: true
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
                        lineBreak: false
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
                        lineBreak: true
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
                        lineBreak: false
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
 
        _fetchLocalStockShortageData: async function () {
            try {
                var sUrl = sap.ui.require.toUrl("plant_intelligence_dev/model/shortageKPI.json");
                var response = await fetch(sUrl);

                if (!response.ok) {
                    throw new Error("HTTP " + response.status + " loading download.json");
                }

                var data = await response.json();

                // Support either the raw OData export shape ({ d: { results: [...] } })
                // or the pre-aggregated KPI shape ({ ShortageKPI: { Items: [...] } })
                if (data && data.ShortageKPI && Array.isArray(data.ShortageKPI.Items)) {
                    return data.ShortageKPI.Items;
                }

                if (data && data.d && Array.isArray(data.d.results)) {
                    return data.d.results;
                }

                return Array.isArray(data) ? data : [];
            } catch (err) {
                MessageToast.show("Error loading download.json: " + err.message);
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
                        var dScheduled = this._toDate(oRow.ScheduledDate);
                        var dBasicFinish = this._toDate(oRow.BasicFinishDate);
                        var nPlannedQty = this._toNumber(oRow.PlannedQty);
                        var nConfirmedQty = this._toNumber(oRow.ConfirmedQty);
 
                        var bDateRisk = dScheduled && dBasicFinish && dScheduled.getTime() > dBasicFinish.getTime();
                        var bMissingDateRisk = !dScheduled || !dBasicFinish;
                        var bQtyRisk = nPlannedQty > 0 && nConfirmedQty < nPlannedQty;
 
                        return bDateRisk || bMissingDateRisk || bQtyRisk;
                    }.bind(this));
 
                    var aDelayDays = aResults.map(function (oRow) {
                        var dScheduled = this._toDate(oRow.ScheduledDate);
                        var dBasicFinish = this._toDate(oRow.BasicFinishDate);
 
                        if (!dScheduled || !dBasicFinish) {
                            return null;
                        }
 
                        if (dScheduled.getTime() <= dBasicFinish.getTime()) {
                            return null;
                        }
 
                        return this._daysBetween(dBasicFinish, dScheduled);
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
 
        _onKpiCardClick: function (oEvent) {
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
            this._showInsightForKey(sKey);
        },
 
      _showInsightForKey: function (sKey) {
    var oModel = this.getView().getModel("dashboardModel");
    var aCards = oModel.getProperty("/cards");
    var oCard = aCards.find(function (c) {
        return c.key === sKey;
    });
    var oMeta = this._insightMeta[sKey];

    if (!oCard || !oMeta) {
        return;
    }

    var bIsGood = oCard.statusState === "Success";
    var sIconClass = bIsGood ? oMeta.iconClassGood : oMeta.iconClassBad;
    var sRecommendation = bIsGood ? oMeta.recommendationGood : oMeta.recommendationBad;

    var sText = oCard.title + " is currently " + oCard.value + oCard.unit +
        " (" + oCard.delta + "). " + oCard.footerRight + ".";

    oModel.setProperty("/selectedInsight/hasSelection", true);
    oModel.setProperty("/selectedInsight/key", sKey);
    oModel.setProperty("/selectedInsight/subtitle", "Insight for selected KPI");
    oModel.setProperty("/selectedInsight/title", oCard.title + " — " + oCard.statusText);
    oModel.setProperty("/selectedInsight/text", sText);
    oModel.setProperty("/selectedInsight/icon", oMeta.icon);
    oModel.setProperty("/selectedInsight/iconClass", sIconClass);
    oModel.setProperty("/selectedInsight/recommendation", sRecommendation);

    oModel.setProperty("/showInsight", true);
    oModel.setProperty("/showEmpty", false);
    oModel.setProperty("/hasSelectionClass", "hasSelection");

    aCards.forEach(function (c) {
        c.selectedClass = (c.key === sKey) ? "kpiTileSelected" : "";
    });

    oModel.setProperty("/cards", aCards);
    oModel.refresh(true);
}
    });
});