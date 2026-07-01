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
            const iCount = aResults.length;

            oModel.setProperty("/cards/" + iIndex + "/value", String(iCount));
            oModel.setProperty("/cards/" + iIndex + "/delta", iCount + " records loaded");
        }
    });
});