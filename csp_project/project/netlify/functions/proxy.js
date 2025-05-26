// .netlify/functions/proxy.js
const axios = require('axios');

exports.handler = async (event) => {
  console.log('Proxy invoked with query:', event.queryStringParameters, 'body:', event.body);

  let api, endpoint, params;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };

  if (event.httpMethod === 'POST' && event.body) {
    const body = JSON.parse(event.body);
    api = body.api;
    endpoint = body.endpoint;
    params = body.params;
  } else {
    const queryParams = event.queryStringParameters || {};
    api = queryParams.api;
    endpoint = queryParams.endpoint;
    params = queryParams.params ? JSON.parse(queryParams.params) : {};
  }

  if (!api || !endpoint) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing api or endpoint parameter' }),
    };
  }

  let url;
  try {
    if (api === 'newsapi') {
      url = `https://newsapi.org/v2/${endpoint}`;
      params.apiKey = process.env.NEWSAPI_API_KEY || 'missing';
      console.log('NewsAPI request:', { url, params });
    } else if (api === 'coinmetrics') {
      url = `https://community-api.coinmetrics.io/v4/${endpoint}`;
      console.log('CoinMetrics request:', { url, params });
    } else if (api === 'reddit') {
      url = `https://www.reddit.com/r/CryptoCurrency.rss`;
      console.log('Reddit request:', { url, params });
    } else if (api === 'openai') {
      url = `https://api.openai.com/v1/${endpoint}`;
      console.log('OpenAI request:', { url, body: params });
      const response = await axios.post(
        url,
        params,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'missing'}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(response.data),
      };
    } else {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unsupported API' }),
      };
    }

    const response = await axios.get(url, {
      params,
      headers: { 'Accept': 'application/json' },
      timeout: 10000,
      maxRedirects: 5,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    return {
      statusCode: error.response?.status || 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message, details: error.response?.data }),
    };
  }
};
