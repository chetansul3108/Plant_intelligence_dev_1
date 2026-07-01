sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog",
    "sap/m/MessageToast"
], function (Controller, JSONModel, BusyDialog, MessageToast) {
    "use strict";

    return Controller.extend("plant_intelligence_dev.controller.Main", {
        onInit: function () {
            this.getView().setModel(new JSONModel({
                cards: [
                    {
                        key: "onTimeDelivery",
                        title: "ON-TIME DELIVERY",
                        value: "96.4",
                        unit: "%",
                        delta: "+1.8% vs last month",
                        footerLeft: "08:42 today",
                        footerRight: "Target ≥95%",
                        statusText: "ON TRACK",
                        statusState: "Success",
                        accentClass: "accentGreen",
                        iconClass: "iconGreen",
                        deltaClass: "deltaGreen",
                        chartClass: "chartGreen",
                        action: "getOnTimeDelivery"
                    },
                    {
                        key: "orderLifecycle",
                        title: "ORDER LIFECYCLE DAYS",
                        value: "6.2",
                        unit: "d",
                        delta: "+0.4d vs last month",
                        footerLeft: "08:42 today",
                        footerRight: "Target ≤5 days",
                        statusText: "MONITOR",
                        statusState: "Warning",
                        accentClass: "accentAmber",
                        iconClass: "iconAmber",
                        deltaClass: "deltaRed",
                        chartClass: "chartAmber",
                        action: "getSalesToPayment"
                    },
                    {
                        key: "otif",
                        title: "OTIF %",
                        value: "95.1",
                        unit: "%",
                        delta: "+2.3% vs last month",
                        footerLeft: "08:42 today",
                        footerRight: "Target ≥95%",
                        statusText: "ON TRACK",
                        statusState: "Success",
                        accentClass: "accentGreen",
                        iconClass: "iconGreen",
                        deltaClass: "deltaGreen",
                        chartClass: "chartGreen",
                        action: "getOnTimeDelivery"
                    },
                    {
                        key: "stockShortage",
                        title: "STOCK SHORTAGE COUNT",
                        value: "14",
                        unit: "",
                        delta: "+6 vs last week — 8 impact orders",
                        footerLeft: "08:42 today",
                        footerRight: "8 order-impacting",
                        statusText: "CRITICAL",
                        statusState: "Error",
                        accentClass: "accentRed",
                        iconClass: "iconRed",
                        deltaClass: "deltaRed",
                        chartClass: "chartRed",
                        action: "getStockShortage"
                    },
                    {
                        key: "scheduleRisk",
                        title: "SCHEDULE RISK ORDERS",
                        value: "23",
                        unit: "",
                        delta: "Avg 1.4 day delay",
                        footerLeft: "08:42 today",
                        footerRight: "5 >2 day delays",
                        statusText: "MONITOR",
                        statusState: "Warning",
                        accentClass: "accentAmber",
                        iconClass: "iconAmber",
                        deltaClass: "deltaAmber",
                        chartClass: "chartAmber",
                        action: "getPlannedOrderSchedule"
                    },
                    {
                        key: "transitRisk",
                        title: "TRANSIT RISK ORDERS",
                        value: "9",
                        unit: "",
                        delta: "ETA delayed >2 days",
                        footerLeft: "08:42 today",
                        footerRight: "3 priority customers",
                        statusText: "WATCH",
                        statusState: "Information",
                        accentClass: "accentBlue",
                        iconClass: "iconBlue",
                        deltaClass: "deltaRed",
                        chartClass: "chartBlue",
                        action: "getSalesOrdersInTransit"
                    }
                ]
            }), "dashboardModel");
        },

        _fetchData: async function (action) {
            const oBusyDialog = new BusyDialog({ text: "Loading..." });
            oBusyDialog.open();

            try {
                const response = await fetch(`/transit-service/${action}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({})
                });

                const contentType = response.headers.get("content-type") || "";
                if (!response.ok || !contentType.includes("application/json")) {
                    const text = await response.text();
                    throw new Error("HTTP " + response.status + ": " + text);
                }

                const data = await response.json();
                return data.value || [];
            } catch (err) {
                MessageToast.show("Error: " + err.message);
                return [];
            } finally {
                oBusyDialog.close();
            }
        },

        _toDate: function (v) {
            if (!v) {
                return null;
            }

            if (typeof v === "string" && v.startsWith("/Date(")) {
                const m = v.match(/\/Date\((\d+)\)\//);
                if (m) {
                    return new Date(Number(m[1]));
                }
            }

            const d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
        },

        _toNumber: function (v) {
            const n = parseFloat(v);
            return isNaN(n) ? 0 : n;
        },

        _daysBetween: function (d1, d2) {
            if (!d1 || !d2) {
                return null;
            }
            return (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
        },

        _calculateCardMetrics: function (sKey, aResults) {
            let sValue = "0";
            let sDelta = "0 records loaded";

            if (!Array.isArray(aResults) || aResults.length === 0) {
                return {
                    value: "0",
                    delta: "0 records loaded"
                };
            }

            switch (sKey) {
case "orderLifecycle": {
    const aDebugRows = [];

    const aValid = aResults.map(function (oRow, iIndex) {
        const dStart = this._toDate(oRow.OrderCreationDate);
        const dEnd = this._toDate(oRow.InvoiceDate);

        let nDays = null;
        let sReason = "";

        if (!dStart) {
            sReason = "Missing OrderCreationDate";
        } else if (!dEnd) {
            sReason = "Missing InvoiceDate";
        } else {
            nDays = this._daysBetween(dStart, dEnd);

            if (nDays < 0) {
                sReason = "Negative days";
                nDays = null;
            }
        }

        if (iIndex < 10) {
            aDebugRows.push({
                SalesOrder: oRow.SalesOrder || "",
                BillingDocument: oRow.BillingDocument || "",
                OrderCreationDate: oRow.OrderCreationDate || "",
                InvoiceDate: oRow.InvoiceDate || "",
                Days: nDays,
                Reason: sReason
            });
        }

        return nDays;
    }.bind(this)).filter(function (nDays) {
        return nDays !== null;
    });

    const nTotal = aValid.reduce(function (sum, nDays) {
        return sum + nDays;
    }, 0);

    const nAvg = aValid.length ? (nTotal / aValid.length) : 0;

    console.table(aDebugRows);
    console.log("ORDER LIFECYCLE VALID COUNT:", aValid.length);
    console.log("ORDER LIFECYCLE TOTAL DAYS:", nTotal);
    console.log("ORDER LIFECYCLE AVG DAYS:", nAvg);

    sValue = nAvg.toFixed(1);
    sDelta = aValid.length + " lifecycle records measured";
    break;
}

case "onTimeDelivery": {
    const aValid = aResults.filter(function (oRow) {
        return !!this._toDate(oRow.PlannedDeliveryDate) &&
               !!this._toDate(oRow.ActualGIDeliveryDate);
    }.bind(this));

    const iTotal = aValid.length;

    const iOnTime = aValid.filter(function (oRow) {
        const dPlanned = this._toDate(oRow.PlannedDeliveryDate);
        const dActual = this._toDate(oRow.ActualGIDeliveryDate);
        return dActual.getTime() <= dPlanned.getTime();
    }.bind(this)).length;

    const nPct = iTotal ? (iOnTime / iTotal) * 100 : 0;

    sValue = nPct.toFixed(1);
    sDelta = iOnTime + " on-time of " + iTotal + " valid deliveries";

    console.log("ON TIME DELIVERY RAW COUNT:", aResults.length);
    console.log("ON TIME DELIVERY VALID COUNT:", iTotal);
    console.log("ON TIME DELIVERY ON-TIME COUNT:", iOnTime);
    console.log("ON TIME DELIVERY %:", nPct);
    console.log("ON TIME DELIVERY FIRST ROW:", aResults[0]);

    break;
}

case "otif": {
    const aValid = aResults.filter(function (oRow) {
        return !!this._toDate(oRow.PlannedDeliveryDate) &&
               !!this._toDate(oRow.ActualGIDeliveryDate) &&
               this._toNumber(oRow.OrderedQty) > 0 &&
               this._toNumber(oRow.ActualDeliveryQuantity) > 0;
    }.bind(this));

    const iTotal = aValid.length;

    const iOtif = aValid.filter(function (oRow) {
        const dPlanned = this._toDate(oRow.PlannedDeliveryDate);
        const dActual = this._toDate(oRow.ActualGIDeliveryDate);
        const bOnTime = dActual.getTime() <= dPlanned.getTime();

        const nOrdered = this._toNumber(oRow.OrderedQty);
        const nDelivered = this._toNumber(oRow.ActualDeliveryQuantity);
        const bInFull = nDelivered >= nOrdered;

        return bOnTime && bInFull;
    }.bind(this)).length;

    const nPct = iTotal ? (iOtif / iTotal) * 100 : 0;

    sValue = nPct.toFixed(1);
    sDelta = iOtif + " OTIF of " + iTotal + " valid deliveries";

    console.log("OTIF RAW COUNT:", aResults.length);
    console.log("OTIF VALID COUNT:", iTotal);
    console.log("OTIF COUNT:", iOtif);
    console.log("OTIF %:", nPct);
    console.log("OTIF FIRST ROW:", aResults[0]);

    break;
}  

                case "otif": {
                    const aValid = aResults.filter(function (oRow) {
                        return !!this._toDate(oRow.PlannedDeliveryDate) &&
                               !!this._toDate(oRow.ActualGIDeliveryDate) &&
                               this._toNumber(oRow.OrderedQty) > 0 &&
                               this._toNumber(oRow.ActualDeliveryQuantity) > 0;
                    }.bind(this));

                    const iTotal = aValid.length;
                    const iOtif = aValid.filter(function (oRow) {
                        const dPlanned = this._toDate(oRow.PlannedDeliveryDate);
                        const dActual = this._toDate(oRow.ActualGIDeliveryDate);
                        const bOnTime = dActual.getTime() <= dPlanned.getTime();

                        const nOrdered = this._toNumber(oRow.OrderedQty);
                        const nDelivered = this._toNumber(oRow.ActualDeliveryQuantity);
                        const bInFull = nDelivered >= nOrdered;

                        return bOnTime && bInFull;
                    }.bind(this)).length;

                    const nPct = iTotal ? (iOtif / iTotal) * 100 : 0;
                    sValue = nPct.toFixed(1);
                    sDelta = iOtif + " OTIF of " + iTotal + " valid deliveries";
                    break;
                }

                case "stockShortage": {
                    const iCount = aResults.length;
                    const nShortageQty = aResults.reduce(function (sum, oRow) {
                        return sum + this._toNumber(oRow.ShortageQty);
                    }.bind(this), 0);

                    sValue = String(iCount);
                    sDelta = "Total shortage qty " + nShortageQty.toFixed(2);
                    break;
                }

                case "scheduleRisk": {
    const aRisk = aResults.filter(function (oRow) {
        const dConfirmedEnd = this._toDate(oRow.ScheduledDate);
        const dProductionEnd = this._toDate(oRow.BasicFinishDate);
        const nPlannedQty = this._toNumber(oRow.PlannedQty);
        const nConfirmedQty = this._toNumber(oRow.ConfirmedQty);

        const bNoConfirmedEnd = !dConfirmedEnd;
        const bNoProductionEnd = !dProductionEnd;
        const bQtyRisk = nPlannedQty > 0 && nConfirmedQty < nPlannedQty;

        return bNoConfirmedEnd || bNoProductionEnd || bQtyRisk;
    }.bind(this));

    const aDelayDays = aRisk.map(function (oRow) {
        const dPlannedStart = this._toDate(oRow.BasicStartDate);
        const dConfirmedEnd = this._toDate(oRow.ScheduledDate);

        if (!dPlannedStart || !dConfirmedEnd) {
            return null;
        }

        return this._daysBetween(dPlannedStart, dConfirmedEnd);
    }.bind(this)).filter(function (nDays) {
        return nDays !== null && nDays > 0;
    });

    const nAvgDelay = aDelayDays.length
        ? aDelayDays.reduce(function (a, b) { return a + b; }, 0) / aDelayDays.length
        : 0;

    sValue = String(aRisk.length);
    sDelta = aRisk.length
        ? "Fallback risk from missing end dates / partial confirmation"
        : "No fallback risk found";
    break;
}

                case "transitRisk": {
                    const aRisk = aResults.filter(function (oRow) {
                        const dEta = this._toDate(oRow.ETA);
                        const dRequested = this._toDate(oRow.RequestedDeliveryDate);
                        return dEta && dRequested && dEta.getTime() > dRequested.getTime();
                    }.bind(this));

                    sValue = String(aRisk.length);
                    sDelta = aRisk.length + " orders with delayed ETA";
                    break;
                }

                default: {
                    sValue = String(aResults.length);
                    sDelta = aResults.length + " records loaded";
                    break;
                }
            }

            return {
                value: sValue,
                delta: sDelta
            };
        },

        onCardPress: async function (oEvent) {
            const sKey = oEvent.getSource().data("cardKey");
            const oModel = this.getView().getModel("dashboardModel");
            const aCards = oModel.getProperty("/cards");
            const iIndex = aCards.findIndex(function (oCard) {
                return oCard.key === sKey;
            });

            if (iIndex === -1) {
                return;
            }

            const oCard = aCards[iIndex];
            const aResults = await this._fetchData(oCard.action);
            const oMetrics = this._calculateCardMetrics(oCard.key, aResults);

            oModel.setProperty("/cards/" + iIndex + "/value", oMetrics.value);
            oModel.setProperty("/cards/" + iIndex + "/delta", oMetrics.delta);

            console.log("CARD KEY:", sKey);
            console.log("FIRST ROW:", aResults[0]);
        }
    });
});