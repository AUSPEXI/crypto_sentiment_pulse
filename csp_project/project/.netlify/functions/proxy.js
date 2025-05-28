const axios = require('axios');

const API_KEYS = {
  newsapi: process.env.NEWSAPI_API_KEY,
  coinmetrics: process.env.COINMETRICS_API_KEY,
  cryptopanic: process.env.CRYPTOPANIC_API_TOKEN,
  openai: process.env.OPENAI_API_KEY,
  santiment: process.env.SANTIMENT_API_KEY,
  huggingface: process.env.HUGGINGFACE_API_KEY,
  reddit: '',
};

const API_BASE_URLS = {
  newsapi: 'https://newsapi.org/v2',
  coinmetrics: 'https://community-api.coinmetrics.io',
  cryptopanic: 'https://cryptopanic.com/api',
  openai: 'https://api.openai.com/v1',
  santiment: 'https://api.santiment.net/api',
  huggingface: 'https://api-inference.huggingface.co/models',
  reddit: 'https://www.reddit.com',
};

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const { api, endpoint, params } = event.queryStringParameters || {};
  const body = event.httpMethod === 'POST' ? JSON.parse(event.body || '{}') : {};
  const method = event.httpMethod.toLowerCase();

  if (!api || !endpoint) {
    console.error('Missing api or endpoint in request');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing api or endpoint' }),
    };
  }

  const baseUrl = API_BASE_URLS[api];
  if (!baseUrl) {
    console.error(`Unsupported API: ${api}`);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Unsupported API: ${api}` }),
    };
  }

  const apiKey = API_KEYS[api];
  const headers = {};
  let urlParams = params ? JSON.parse(params) : (method === 'post' ? body.params : {});
  let fullUrl = `${baseUrl}/${endpoint}`;

  if (api === 'openai') {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['Content-Type'] = 'application/json';
  } else if (api === 'huggingface') {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['Content-Type'] = 'application/json';
  } else if (api === 'newsapi') {
    urlParams.apiKey = apiKey; // Use apiKey for NewsAPI
  } else if (api === 'coinmetrics' || api === 'cryptopanic' || api === 'santiment') {
    urlParams.api_key = apiKey;
  }

  console.log(`Constructed URL: ${fullUrl} with params:`, urlParams);
  try {
    const config = {
      method,
      url: fullUrl,
      params: method === 'get' ? urlParams : undefined,
      data: method === 'post' ? urlParams : undefined,
      headers,
      timeout: 10000,
    };

    console.log('Sending request with config:', JSON.stringify(config, null, 2));
    const response = await axios(config);
    console.log('Received response:', JSON.stringify(response.data, null, 2));
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('Proxy error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: fullUrl,
      params: urlParams,
      headers: headers,
    });
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data,
      }),
    };
  }
};
