
'use strict';

require('dotenv').config();

const axios = require('axios');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function buildPrompt(payload) {
    return `
Return only valid JSON in this exact format:
{
  "title": "string",
  "severity": "string",
  "summaryText": "string",
  "recommendedAction": "string"
}

Rules:
- Keep summaryText under 45 words.
- Keep recommendedAction under 25 words.
- Use concise business language.
- Do not add markdown.
- Do not wrap JSON in code fences.

KPI Name: ${payload.kpiName || ''}
KPI Value: ${payload.kpiValue || ''}
Unit: ${payload.unit || ''}
Severity: ${payload.severity || ''}
Target: ${payload.target || ''}
Plant: ${payload.plant || ''}
Additional Context: ${payload.additionalContext || ''}
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
            }
        }
    }

    return {
        title: `${payload.kpiName || 'KPI'} - ${payload.severity || 'MONITOR'}`,
        severity: payload.severity || 'MONITOR',
        summaryText: cleaned.slice(0, 300),
        recommendedAction: 'Review KPI drivers and validate source data.'
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
        max_tokens: 220,
        messages: [
            {
                role: 'system',
                content: 'You generate short KPI insights for SAP dashboards. Return only valid JSON.'
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
    title: parsed.title || `${payload.kpiName || 'KPI'} - ${payload.severity || 'MONITOR'}`,
    severity: parsed.severity || payload.severity || 'MONITOR',
    summaryText: parsed.summaryText || 'No summary generated.',
    recommendedAction: parsed.recommendedAction || 'Review KPI drivers and validate source data.',
    generatedAt: new Date().toISOString(),
    source: 'AI',
    provider: 'Groq',
    model: GROQ_MODEL
};
}

module.exports = {
    getAISummary
};