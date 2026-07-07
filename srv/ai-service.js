'use strict';

require('dotenv').config();
const axios = require('axios');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function buildPrompt(payload) {
    return `
You are an expert SAP Manufacturing and Supply Chain Analytics consultant. Your task is to analyze the KPI together with all supporting data provided. Do not simply summarize the KPI. Think like a senior operations analyst. Analyze the data deeply and determine what the KPI is measuring, performance health, business reasons, bottlenecks, risks, impact, and actionable recommendations.

Return ONLY valid JSON in this exact format:
{
  "title": "string",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW | INFO",
  "status": "Healthy | Warning | Critical",
  "summaryText": "Core insights structured exactly as 4 to 5 distinct bullet points.",
  "rootCause": "Most likely reason based on the supplied data.",
  "businessImpact": "Operational or financial impact.",
  "recommendedAction": "Specific actions to improve the KPI.",
  "warning": "Potential future risk if ignored. Empty string if none.",
  "opportunity": "Suggested optimization opportunity. Empty string if none."
}

Analysis Rules:
- CRITICAL FORMAT RULE: The "summaryText" value MUST be formatted strictly as 4 to 5 distinct bullet points using standard dashes (e.g., "- Point 1\\n- Point 2\\n- Point 3..."). Do not write continuous paragraphs.
- Base every conclusion ONLY on the supplied data. Do not invent facts.
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
`;
}

function extractContent(data) {
    return data?.choices?.[0]?.message?.content || '';
}

function parseJsonSafely(content, payload) {
    if (!content) {
        throw new Error('No AI content returned from Groq');
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

    // Fallback object matching the new schema
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

async function callGroqWithRetry(requestBody, headers, retries = 2) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await axios.post(GROQ_URL, requestBody, {
                headers,
                timeout: 45000
            });

            const content = extractContent(response.data);
            if (!content) {
                throw new Error('No AI content returned from Groq');
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
    const apiKey = (process.env.GROQ_API_KEY || '').trim();

    if (!apiKey) {
        throw new Error('Missing GROQ_API_KEY');
    }

    const requestBody = {
        model: GROQ_MODEL,
        temperature: 0.2, 
        max_tokens: 800, 
        messages: [
            {
                role: 'system',
                content: 'You generate executive SAP dashboard elements. You strictly format summaryText as 4 to 5 bullet points using newlines and dashes. You output valid JSON.'
            },
            {
                role: 'user',
                content: buildPrompt(payload)
            }
        ],
        response_format: { type: 'json_object' }
    };

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };

    let response;
    try {
        response = await callGroqWithRetry(requestBody, headers, 2);
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
        provider: 'Groq',
        model: GROQ_MODEL
    };
}

module.exports = {
    getAISummary
};