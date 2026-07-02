sap.ui.define([
    "sap/ui/core/library"
], function (coreLibrary) {
    "use strict";

    var ValueState = coreLibrary.ValueState;

    function toNumber(v) {
        var n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    }

    return {
        getTargetStatusText: function (sKey, vValue) {
            var nValue = toNumber(vValue);

            switch (sKey) {
                case "onTimeDelivery":
                case "otif":
                    if (nValue >= 95) {
                        return "ON TRACK";
                    }
                    if (nValue >= 90) {
                        return "MONITOR";
                    }
                    return "CRITICAL";

                case "orderLifecycle":
                    if (nValue <= 5) {
                        return "ON TRACK";
                    }
                    if (nValue <= 7) {
                        return "MONITOR";
                    }
                    return "CRITICAL";

                case "stockShortage":
                    return nValue > 0 ? "CRITICAL" : "ON TRACK";

                case "scheduleRisk":
                    if (nValue === 0) {
                        return "ON TRACK";
                    }
                    if (nValue <= 2) {
                        return "MONITOR";
                    }
                    return "CRITICAL";

                case "transitRisk":
                    return nValue > 0 ? "WATCH" : "ON TRACK";

                default:
                    return "MONITOR";
            }
        },

        getTargetStatusState: function (sKey, vValue) {
            var nValue = toNumber(vValue);

            switch (sKey) {
                case "onTimeDelivery":
                case "otif":
                    if (nValue >= 95) {
                        return ValueState.Success;
                    }
                    if (nValue >= 90) {
                        return ValueState.Warning;
                    }
                    return ValueState.Error;

                case "orderLifecycle":
                    if (nValue <= 5) {
                        return ValueState.Success;
                    }
                    if (nValue <= 7) {
                        return ValueState.Warning;
                    }
                    return ValueState.Error;

                case "stockShortage":
                    return nValue > 0 ? ValueState.Error : ValueState.Success;

                case "scheduleRisk":
                    if (nValue === 0) {
                        return ValueState.Success;
                    }
                    if (nValue <= 2) {
                        return ValueState.Warning;
                    }
                    return ValueState.Error;

                case "transitRisk":
                    return nValue > 0 ? ValueState.Information : ValueState.Success;

                default:
                    return ValueState.None;
            }
        }
    };
});