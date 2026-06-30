sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog",
    "sap/m/MessageToast"
], function (Controller, JSONModel, BusyDialog, MessageToast) {
    "use strict";

    return Controller.extend("plantintelli2.controller.Main", {

        onInit: function () {
            this.getView().setModel(new JSONModel([]), "transitModel");
            this.getView().setModel(new JSONModel([]), "onTimeModel");
            this.getView().setModel(new JSONModel([]), "stockShortageModel");
            this.getView().setModel(new JSONModel([]), "plannedOrderModel");
            this.getView().setModel(new JSONModel([]), "salesToPaymentModel");
            this.getView().setModel(new JSONModel([]), "materialVHModel");
            this.getView().setModel(new JSONModel([]), "shippingPointVHModel");
            this.getView().setModel(new JSONModel([]), "customerVHModel");
        },

        _fetchData: async function (action, modelName) {
            const oBusyDialog = new BusyDialog({ text: "Loading..." });
            oBusyDialog.open();

            try {
                const url = `/transit-service/${action}`;
                console.log("[Fetching]", url);

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({})
                });

                const contentType = response.headers.get("content-type") || "";

                if (!response.ok || !contentType.includes("application/json")) {
                    const text = await response.text();
                    console.error("Server response:", text);
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                const results = data.value || [];

                this.getView().getModel(modelName).setData(results);
                MessageToast.show(`Loaded ${results.length} records`);
            } catch (err) {
                console.error(`[${action}]`, err);
                MessageToast.show("Error: " + err.message);
            } finally {
                oBusyDialog.close();
            }
        },

        onLoadTransit: function () {
            this._fetchData("getSalesOrdersInTransit", "transitModel");
        },

        onLoadOnTimeDelivery: function () {
            this._fetchData("getOnTimeDelivery", "onTimeModel");
        },

        onLoadStockShortage: function () {
            this._fetchData("getStockShortage", "stockShortageModel");
        },

        onLoadPlannedOrders: function () {
            this._fetchData("getPlannedOrderSchedule", "plannedOrderModel");
        },

        onLoadSalesToPayment: function () {
            this._fetchData("getSalesToPayment", "salesToPaymentModel");
        },

        onLoadMaterialVH: function () {
            this._fetchData("getMaterialVH", "materialVHModel");
        },

        onLoadShippingPointVH: function () {
            this._fetchData("getShippingPointVH", "shippingPointVHModel");
        },

        onLoadCustomerVH: function () {
            this._fetchData("getCustomerVH", "customerVHModel");
        }
    });
});