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
                        action: "getOnTimeDelivery"
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
                        action: "getSalesToPayment"
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
                        action: "getOnTimeDelivery"
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
                        action: "getStockShortage"
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
                        action: "getPlannedOrderSchedule"
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
                        action: "getSalesOrdersInTransit"
                    }
                ]
            }), "dashboardModel");

            this._autoRefreshInterval = 5 * 60 * 1000;
            this._loadAllCards();
            this._startAutoRefresh();
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
            const oNow = new Date();
            const sHours = String(oNow.getHours()).padStart(2, "0");
            const sMinutes = String(oNow.getMinutes()).padStart(2, "0");
            return sHours + ":" + sMinutes + " today";
        },

        _fetchData: async function (action, bShowBusy) {
            let oBusyDialog = null;

            if (bShowBusy) {
                oBusyDialog = new BusyDialog({ text: "Loading..." });
                oBusyDialog.open();
            }

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
                    const aValid = aResults.map(function (oRow) {
                        const dStart = this._toDate(oRow.OrderCreationDate);
                        const dEnd = this._toDate(oRow.InvoiceDate);

                        if (!dStart || !dEnd) {
                            return null;
                        }

                        const nDays = this._daysBetween(dStart, dEnd);
                        return nDays !== null && nDays >= 0 ? nDays : null;
                    }.bind(this)).filter(function (nDays) {
                        return nDays !== null;
                    });

                    const nTotal = aValid.reduce(function (sum, nDays) {
                        return sum + nDays;
                    }, 0);

                    const nAvg = aValid.length ? (nTotal / aValid.length) : 0;

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

    const nShortageValue = aResults.reduce(function (sum, oRow) {
        const nQty = this._toNumber(oRow.ShortageQty);
        const nPrice = this._toNumber(oRow.StandardPrice);
        return sum + (nQty * nPrice);
    }.bind(this), 0);

    sValue = String(iCount);
    sDelta = "Shortage value " + nShortageValue.toFixed(2);
    break;
}

                case "scheduleRisk": {
    const aRisk = aResults.filter(function (oRow) {
        const dScheduled = this._toDate(oRow.ScheduledDate);
        const dBasicFinish = this._toDate(oRow.BasicFinishDate);
        const nPlannedQty = this._toNumber(oRow.PlannedQty);
        const nConfirmedQty = this._toNumber(oRow.ConfirmedQty);

        const bDateRisk = dScheduled && dBasicFinish && dScheduled.getTime() > dBasicFinish.getTime();
        const bMissingDateRisk = !dScheduled || !dBasicFinish;
        const bQtyRisk = nPlannedQty > 0 && nConfirmedQty < nPlannedQty;

        return bDateRisk || bMissingDateRisk || bQtyRisk;
    }.bind(this));

    const aDelayDays = aResults.map(function (oRow) {
        const dScheduled = this._toDate(oRow.ScheduledDate);
        const dBasicFinish = this._toDate(oRow.BasicFinishDate);

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

    const nAvgDelay = aDelayDays.length
        ? aDelayDays.reduce(function (sum, nDays) {
            return sum + nDays;
        }, 0) / aDelayDays.length
        : null;

    sValue = String(aRisk.length);
    sDelta = nAvgDelay !== null
        ? "Avg " + nAvgDelay.toFixed(1) + " day delay"
        : "Avg delay N/A";

    break;
}

                case "transitRisk": {
                    const aRisk = aResults.filter(function (oRow) {
                        const dEta = this._toDate(oRow.ETA);
                        const dRequested = this._toDate(oRow.RequestedDeliveryDate);
                        return dEta && dRequested && dEta.getTime() > dRequested.getTime();
                    }.bind(this));

                    const aDelayedDays = aRisk.map(function (oRow) {
                        const dEta = this._toDate(oRow.ETA);
                        const dRequested = this._toDate(oRow.RequestedDeliveryDate);
                        return this._daysBetween(dRequested, dEta);
                    }.bind(this)).filter(function (nDays) {
                        return nDays !== null && nDays > 0;
                    });

                    const nAvgDelay = aDelayedDays.length
                        ? aDelayedDays.reduce(function (a, b) { return a + b; }, 0) / aDelayedDays.length
                        : 0;

                    sValue = String(aRisk.length);
                    sDelta = aRisk.length
                        ? "ETA delayed avg " + nAvgDelay.toFixed(1) + " days"
                        : "No delayed transit orders";
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

        _loadCardByIndex: async function (iIndex, bShowBusy) {
            const oModel = this.getView().getModel("dashboardModel");
            const oCard = oModel.getProperty("/cards/" + iIndex);

            if (!oCard) {
                return;
            }

            const aResults = await this._fetchData(oCard.action, bShowBusy);
            const oMetrics = this._calculateCardMetrics(oCard.key, aResults);

            oModel.setProperty("/cards/" + iIndex + "/value", oMetrics.value);
            oModel.setProperty("/cards/" + iIndex + "/delta", oMetrics.delta);
            oModel.setProperty("/cards/" + iIndex + "/footerLeft", this._getCurrentTimeText());

            console.log("CARD KEY:", oCard.key);
            console.log("FIRST ROW:", aResults[0]);
        },

        _loadAllCards: async function (bShowBusy) {
            const oModel = this.getView().getModel("dashboardModel");
            const aCards = oModel.getProperty("/cards") || [];
            const bBusy = bShowBusy !== false;

            if (bBusy) {
                const oBusyDialog = new BusyDialog({ text: "Loading dashboard..." });
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
            const sKey = oEvent.getSource().data("cardKey");
            const oModel = this.getView().getModel("dashboardModel");
            const aCards = oModel.getProperty("/cards");
            const iIndex = aCards.findIndex(function (oCard) {
                return oCard.key === sKey;
            });

            if (iIndex === -1) {
                return;
            }

            await this._loadCardByIndex(iIndex, true);
        },

        onRefreshDashboard: async function () {
            await this._loadAllCards(true);
        }
    });
});