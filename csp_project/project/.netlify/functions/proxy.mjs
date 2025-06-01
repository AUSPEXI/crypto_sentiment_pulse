// .netlify/functions/proxy.mjs
import fetch from 'node-fetch';

const API_KEYS = {
  newsapi: process.env.NEWSAPI_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  coingecko: process.env.COINGECKO_API_KEY || '',
  reddit: '',
};

const BASE_URLS = {
  newsapi: 'https://newsapi.org/v2',
  openai: 'https://api.openai.com',
  coingecko: 'https://api.coingecko.com/api/v3',
  reddit: 'https://www.reddit.com',
};

export default async (req, context) => {
  const { api, endpoint, params } = req.queryStringParameters || {};

  if (!api || !endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing api or endpoint parameter' }),
    };
  }

  const baseUrl = BASE_URLS[api.toLowerCase()];
  if (!baseUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Unsupported API' }),
    };
  }

  const apiKey = API_KEYS[api.toLowerCase()];
  let headers = {};
  if (api.toLowerCase() === 'openai') {
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  } else if (api.toLowerCase() === 'newsapi') {
    headers = { 'X-Api-Key': apiKey };
  }

  let url = `${baseUrl}/${endpoint}`;
  let options = { headers };

  try {
    if (params) {
      const decodedParams = JSON.parse(decodeURIComponent(params));
      if (api.toLowerCase() === 'openai') {
        url = `${baseUrl}/${endpoint}`;
        options = {
          ...options,
          method: 'POST',
          body: JSON.stringify(decodedParams),
        };
      } else {
        const queryString = new URLSearchParams(decodedParams).toString();
        url = `${url}?${queryString}`;
      }
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(data)}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

export const config = {
  path: '/api/proxy',
};
