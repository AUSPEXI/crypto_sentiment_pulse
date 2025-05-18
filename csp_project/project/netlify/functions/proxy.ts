import axios from 'axios';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const { url, query } = event.queryStringParameters;
  
  if (!url || !url.startsWith('http')) {
    console.error('Proxy error: Invalid or missing URL parameter', { url });
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or missing URL parameter' }) };
  }

  try {
    console.log(`Proxying request to: ${url}, Full Headers:`, event.headers);
    
    const requestConfig: any = {
      headers: {
        'Authorization': event.headers['authorization'] || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'CryptoSentimentPulse/1.0'
      },
      timeout: 20000,
      validateStatus: (status: number) => status >= 200 && status < 500
    };

    // If GraphQL query is present, use POST method
    if (query) {
      requestConfig.method = 'POST';
      requestConfig.data = { query };
    }

    const response = await axios(url, requestConfig);
    
    // Check if response is JSON
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid response content type:', contentType);
      return {
        statusCode: 422,
        body: JSON.stringify({ 
          error: 'Invalid response type from upstream server',
          details: 'Expected JSON response'
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }
    
    console.log(`Proxy success: ${url} returned status ${response.status}, Full Response Headers:`, response.headers, 'Data Preview:', JSON.stringify(response.data).substring(0, 200));
    
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (error: any) {
    console.error(`Proxy error for ${url}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data?.substring(0, 200) || 'No response data',
      requestHeaders: event.headers,
      responseHeaders: error.response?.headers,
      stack: error.stack
    });
    
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ 
        error: error.message,
        details: error.response?.data
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};

export { handler };