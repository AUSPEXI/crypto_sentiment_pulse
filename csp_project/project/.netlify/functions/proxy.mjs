// netlify/functions/proxy.mjs
import { handler as createHandler } from '@netlify/functions';

const myHandler = async (event, context) => {
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

    const data = await response.json();
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

export const handler = createHandler(myHandler);
