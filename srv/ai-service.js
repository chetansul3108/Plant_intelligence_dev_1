'use strict';

require('dotenv').config();
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

const AICORE_DEPLOYMENT_ID = process.env.AICORE_DEPLOYMENT_ID || 'd01b4f25c36edc95'; // gpt-4o
const AICORE_API_VERSION = process.env.AICORE_API_VERSION || '2024-02-01';
const AICORE_RESOURCE_GROUP = process.env.AICORE_RESOURCE_GROUP || 'default';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function buildPrompt(payload) {
    var sForecastSection = "No predictive ML forecast is available for this KPI.";

    if (payload.forecastData) {
        var oForecast = payload.forecastData;
        if (typeof oForecast === "string") {
            try {
                oForecast = JSON.parse(oForecast);
            } catch (e) {
                oForecast = null;
            }
        }
        if (oForecast) {
            sForecastSection = JSON.stringify(oForecast, null, 2);
        }
    }

    return `
You are an expert SAP Manufacturing and Supply Chain Analytics consultant. Your task is to analyze the KPI together with all supporting data AND the predictive ML forecast provided. Do not simply summarize the KPI. Think like a senior operations analyst who blends current performance with the forward-looking prediction to judge health, root cause, risk, and next actions.

Return ONLY valid JSON in this exact format:
{
  "title": "string",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW | INFO",
  "status": "Healthy | Warning | Critical",
  "summaryText": "Core insights structured exactly as 4 to 5 distinct bullet points.",
  "rootCause": "Most likely reason based on the supplied data and forecast.",
  "businessImpact": "Operational or financial impact, factoring in the forecast trend.",
  "recommendedAction": "Specific actions to improve the KPI, informed by the forecast direction.",
  "warning": "Potential future risk if ignored, using the forecast as a leading indicator. Empty string if none.",
  "opportunity": "Suggested optimization opportunity. Empty string if none."
}

Analysis Rules:
- CRITICAL FORMAT RULE: The "summaryText" value MUST be formatted strictly as 4 to 5 distinct bullet points using standard dashes (e.g., "- Point 1\\n- Point 2\\n- Point 3..."). Do not write continuous paragraphs.
- Base every conclusion ONLY on the supplied data and forecast. Do not invent facts.
- If the forecast indicates deteriorating conditions (e.g. shortage expected, high delay risk) even though the current KPI value looks fine, call that out explicitly — treat the forecast as a leading indicator, not just a footnote.
- If the forecast agrees with current performance, use it to reinforce confidence rather than repeating it verbatim.
- Keep the language concise, professional, and suitable for an SAP executive dashboard.
- Do not add markdown backticks (\`\`\`) around the JSON response.

KPI Information:
KPI Name: ${payload.kpiName || ''}
Current Value: ${payload.kpiValue || ''}
Target: ${payload.target || ''}
Unit: ${payload.unit || ''}
Severity: ${payload.severity || ''}
Plant: ${payload.plant || ''}
Additional Context: ${payload.additionalContext || ''}
Supporting KPI Dataset: ${JSON.stringify(payload.data || [], null, 2)}

Predictive ML Forecast Output (leading indicator — weigh this heavily in rootCause, recommendedAction and warning):
${sForecastSection}
`;
}

function extractContent(data) {
    return data?.choices?.[0]?.message?.content || '';
}

function parseJsonSafely(content, payload) {
    if (!content) {
        throw new Error('No AI content returned from AI Core');
    }

    const cleaned = String(content).trim();

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (innerErr) {
                // Fall through to fallback object
            }
        }
    }

    // Fallback object matching the schema
    return {
        title: `${payload.kpiName || 'KPI'} - ${payload.severity || 'MONITOR'}`,
        severity: payload.severity || 'INFO',
        status: 'Warning',
        summaryText: "- Data processing error encountered.\\n- Unable to structure the real-time operational summary.\\n- Please check source systems manually.",
        rootCause: 'Data analysis could not be fully structuralized.',
        businessImpact: 'Unclear operational impact due to parsing error.',
        recommendedAction: 'Review KPI drivers and validate source data manually.',
        warning: 'Potential data processing discrepancy.',
        opportunity: ''
    };
}

async function callAiCoreWithRetry(requestData, retries = 2) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await executeHttpRequest(
                { destinationName: 'aicore' },
                {
                    method: 'POST',
                    url: `/v2/inference/deployments/${AICORE_DEPLOYMENT_ID}/chat/completions?api-version=${AICORE_API_VERSION}`,
                    headers: {
                        'AI-Resource-Group': AICORE_RESOURCE_GROUP,
                        'Content-Type': 'application/json'
                    },
                    data: requestData,
                    timeout: 45000
                }
            );

            const content = extractContent(response.data);
            if (!content) {
                throw new Error('No AI content returned from AI Core');
            }

            return response;
        } catch (err) {
            lastError = err;
            const status = err?.response?.status;

            if ((status === 429 || status === 503) && attempt < retries) {
                await sleep(1500 * (attempt + 1));
                continue;
            }

            throw err;
        }
    }

    throw lastError;
}

async function getAISummary(payload) {
    const requestData = {
        messages: [
            {
                role: 'system',
                content: 'You generate executive SAP dashboard elements. You strictly format summaryText as 4 to 5 bullet points using newlines and dashes. You output valid JSON only, with no markdown fencing.'
            },
            {
                role: 'user',
                content: buildPrompt(payload)
            }
        ],
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: 'json_object' }
    };

    let response;
    try {
        response = await callAiCoreWithRetry(requestData, 2);
    } catch (err) {
        if (err.response) {
            const status = err.response.status;
            const data = JSON.stringify(err.response.data);
            throw new Error(`HTTP ${status}: ${data}`);
        }
        throw err;
    }

    const content = extractContent(response.data);
    const parsed = parseJsonSafely(content, payload);

    return {
        title: parsed.title,
        severity: parsed.severity,
        status: parsed.status,
        summaryText: parsed.summaryText,
        rootCause: parsed.rootCause,
        businessImpact: parsed.businessImpact,
        recommendedAction: parsed.recommendedAction,
        warning: parsed.warning,
        opportunity: parsed.opportunity,
        generatedAt: new Date().toISOString(),
        source: 'AI',
        provider: 'AICore',
        model: `AzureOpenAI:${AICORE_DEPLOYMENT_ID}`
    };
}

module.exports = {
    getAISummary
};