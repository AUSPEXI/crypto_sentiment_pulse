// netlify/functions/proxy.mjs
export const handler = async (event, context) => {
  const { queryStringParameters, httpMethod } = event;
  const api = queryStringParameters?.api;
  const endpoint = queryStringParameters?.endpoint;
  const params = queryStringParameters?.params ? JSON.parse(queryStringParameters.params) : {};
  const baseUrl = queryStringParameters?.baseUrl;

  if (!api || !endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing api or endpoint parameter' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const url = baseUrl ? `${baseUrl}/${endpoint}` : `https://api.${api}.com/${endpoint}`;
    const response = await fetch(url, {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env[api.toUpperCase() + '_API_KEY'] || ''}`,
      },
      body: httpMethod === 'POST' ? JSON.stringify(params) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && (contentType.includes('application/xml') || contentType.includes('text/xml'))) {
      const xml2js = await import('xml2js');
      const xml = await response.text();
      const parsed = await xml2js.parseStringPromise(xml);
      data = parsed;
    } else {
      data = await response.text(); // Fallback to text for JSON or other types
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ data }), // Always return JSON
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
