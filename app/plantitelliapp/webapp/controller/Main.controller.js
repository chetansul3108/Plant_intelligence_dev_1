sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (
    Controller,
    JSONModel,
    MessageToast
) {

    "use strict";

    return Controller.extend(
        "plant_intelligence_dev.controller.Main",
        {

           onLoadData: async function () {

    try {

        const response = await fetch(
            "/odata/v4/plant/getTransitData",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        console.log("Response Status:", response.status);
        console.log("Response Data:", data);

        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }

        const oModel = new sap.ui.model.json.JSONModel(
            data.value || []
        );

        this.getView().setModel(oModel);

    } catch (error) {

        console.error(error);

    }
}

        }
    );
});