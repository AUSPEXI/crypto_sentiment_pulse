// netlify/functions/proxy.ts
import { Handler } from '@netlify/functions';

const API_KEYS = {
  newsapi: process.env.NEWSAPI_KEY || '',
  cryptopanic: process.env.CRYPTOPANIC_API_TOKEN || '',
  openai: process.env.OPENAI_API_KEY || '',
  santiment: process.env.SANTIMENT_API_KEY || '',
  huggingface: process.env.HUGGINGFACE_API_KEY || '',
  coingecko: '', // CoinGecko doesn't require an API key for public endpoints
};

const BASE_URLS = {
  newsapi: 'https://newsapi.org/v2',
  cryptopanic: 'https://cryptopanic.com/api',
  openai: 'https://api.openai.com/v1',
  santiment: 'https://api.santiment.net/api/v1',
  huggingface: 'https://api-inference.huggingface.co/models',
  coingecko: 'https://api.coingecko.com/api/v3',
};

const defaultResponse = { status: 'error', data: null };

export const handler: Handler = async (event) => {
  const { api, endpoint, params, baseUrl } = event.queryStringParameters || {};
  if (!api || !endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ...defaultResponse, error: 'Missing api or endpoint parameter' }),
    };
  }

  const apiKey = API_KEYS[api];
  const defaultBaseUrl = BASE_URLS[api];
  const url = `${baseUrl || defaultBaseUrl}/${endpoint}`;
  const method = event.httpMethod as 'GET' | 'POST';
  const parsedParams = params ? JSON.parse(params) : {};

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (api === 'newsapi') {
    headers['X-Api-Key'] = apiKey;
  } else if (api === 'openai' || api === 'huggingface') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (api === 'santiment') {
    headers['Authorization'] = `Apikey ${apiKey}`;
  } else if (api === 'cryptopanic' && parsedParams.auth_token) {
    parsedParams.auth_token = apiKey;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify(parsedParams) : undefined,
      timeout: 10000, // Add timeout to prevent hanging
    });

    if (!response.ok) {
      console.error(`Proxy error for ${api}/${endpoint}: Status ${response.status}`);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ...defaultResponse, error: `Upstream error: ${response.statusText}` }),
      };
    }

    const data = await response.json();
    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ status: 'success', data }),
    };
  } catch (error) {
    console.error(`Proxy error for ${api}/${endpoint}:`, error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ...defaultResponse, error: error.message }),
    };
  }
};
