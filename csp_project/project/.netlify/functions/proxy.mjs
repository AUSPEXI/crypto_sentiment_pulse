import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import { SentimentIntensityAnalyzer } from 'vader-sentiment';

const API_KEYS = {
  newsapi: process.env.NEWSAPI_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  cryptopanic: process.env.CRYPTOPANIC_API_KEY || process.env.CRYPTOPANIC_API_TOKEN,
  huggingface: process.env.HUGGINGFACE_API_KEY,
  santiment: process.env.SANTIMENT_API_KEY,
  coinmarketcap: process.env.COINMARKETCAP_API_KEY || '',
  coingecko: process.env.COINGECKO_API_KEY || '',
  reddit: '',
  cryptocompare: process.env.CRYPTOCOMPARE_API_KEY || '',
  messari: '',
};

const BASE_URLS = {
  newsapi: 'https://newsapi.org/v2',
  openai: 'https://api.openai.com',
  cryptopanic: 'https://cryptopanic.com/api/v1',
  huggingface: 'https://api-inference.huggingface.co/models',
  santiment: 'https://api.santiment.net',
  coinmarketcap: 'https://pro-api.coinmarketcap.com/v1',
  coingecko: 'https://api.coingecko.com/api/v3',
  reddit: 'https://www.reddit.com',
  cryptocompare: 'https://min-api.cryptocompare.com/data/v2',
  messari: 'https://data.messari.io/api/v1',
};

const TIMEOUT_MS = 8000; // 8 seconds to stay within Netlify's 10-second limit

export default async (req, context) => {
  const { api, endpoint, params } = req.queryStringParameters || {};

  if (!api || (!endpoint && api.toLowerCase() !== 'local-sentiment')) {
    console.error('Missing api or endpoint parameter', { api, endpoint });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing api or endpoint parameter' }),
    };
  }

  if (api.toLowerCase() === 'local-sentiment') {
    try {
      const decodedParams = JSON.parse(decodeURIComponent(params || '{}'));
      const text = decodedParams.text || '';
      if (!text) {
        console.error('No text provided for local sentiment analysis');
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'No text provided' }),
        };
      }
      const sentiment = SentimentIntensityAnalyzer.polarity_scores(text);
      const score = sentiment.compound * 10; // Scale to -10 to 10
      return {
        statusCode: 200,
        body: JSON.stringify({ score }),
      };
    } catch (error) {
      console.error('Local sentiment error:', error.message, error.stack);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Local sentiment failed: ${error.message}` }),
      };
    }
  }

  const baseUrl = BASE_URLS[api.toLowerCase()];
  if (!baseUrl) {
    console.error('Unsupported API', { api });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Unsupported API: ${api}` }),
    };
  }

  const apiKey = API_KEYS[api.toLowerCase()];
  let headers = {};
  let isXml = false;

  switch (api.toLowerCase()) {
    case 'openai':
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      break;
    case 'newsapi':
      headers = { 'X-Api-Key': apiKey };
      break;
    case 'cryptopanic':
      headers = { 'Auth-Token': apiKey };
      break;
    case 'huggingface':
      headers = { 'Authorization': `Bearer ${apiKey}` };
      break;
    case 'santiment':
      headers = { 'Authorization': `Apikey ${apiKey}` };
      break;
    case 'coinmarketcap':
      headers = { 'X-CMC_PRO_API_KEY': apiKey };
      break;
    case 'cryptocompare':
      headers = { 'Authorization': `Apikey ${apiKey}` };
      break;
    case 'reddit':
      isXml = endpoint.endsWith('.rss');
      break;
  }

  let url = `${baseUrl}/${endpoint}`;
  let options = { headers };

  try {
    if (params) {
      const decodedParams = JSON.parse(decodeURIComponent(params));
      if (['openai', 'huggingface', 'santiment'].includes(api.toLowerCase())) {
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

    console.log('Proxying to:', url, 'Options:', { method: options.method || 'GET', headers });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    options.signal = controller.signal;

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      console.error('API response error:', { status: response.status, text });
      throw new Error(`API request failed with status ${response.status}: ${text}`);
    }

    let data;
    if (isXml) {
      const text = await response.text();
      data = await parseStringPromise(text);
    } else {
      data = await response.json();
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error(`Proxy error for ${api}/${endpoint}:`, error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Proxy failed: ${error.message}` }),
    };
  }
};
