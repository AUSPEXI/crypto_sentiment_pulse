// .netlify/functions/proxy.mjs
export const handler = async (event, context) => {
  const { queryStringParameters, httpMethod } = event;
  const api = queryStringParameters?.api;
  const endpoint = queryStringParameters?.endpoint;
  const params = queryStringParameters?.params ? JSON.parse(decodeURIComponent(queryStringParameters.params)) : {};

  if (!api || !endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing api or endpoint parameter' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // Define base URLs for each API
    let baseUrl;
    switch (api) {
      case 'coingecko':
        baseUrl = 'https://api.coingecko.com/api/v3';
        break;
      case 'newsapi':
        baseUrl = 'https://newsapi.org/v2';
        break;
      case 'openai':
        baseUrl = 'https://api.openai.com';
        break;
      case 'reddit':
        baseUrl = 'https://www.reddit.com';
        break;
      default:
        baseUrl = `https://api.${api}.com`;
    }

    const url = `${baseUrl}/${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env[api.toUpperCase() + '_API_KEY'] || ''}`,
    };
    if (api === 'reddit') {
      headers['User-Agent'] = 'CryptoSentimentPulse/1.0 (by /u/YourRedditUsername)';
    }

    const response = await fetch(url, {
      method: httpMethod,
      headers,
      body: httpMethod === 'POST' ? JSON.stringify(params) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && (contentType.includes('application/xml') || contentType.includes('text/xml'))) {
      const { parseStringPromise } = await import('xml2js');
      const xml = await response.text();
      data = await parseStringPromise(xml);
    } else {
      data = await response.json();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ data }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
