// tools-mcp-server: Real MCP server (JSON-RPC 2.0)
// Spec: https://modelcontextprotocol.io/specification
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SERVER_INFO = {
  name: 'tools-that-dont-upload',
  version: '1.0.0',
  description: '442 free API tools for file processing, data conversion, code generation. Zero retention after processing. No authentication required for free tier (50 req/day). CORS enabled. Privacy policy at https://toolsthatdontupload.com/privacy/',
};

// Define MCP tools with proper JSON Schema
const MCP_TOOLS = [
  {
    name: 'hash_text',
    description: 'Hash text using SHA-256, SHA-384, or SHA-512',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to hash' },
        algorithm: { type: 'string', enum: ['SHA-256', 'SHA-384', 'SHA-512'], default: 'SHA-256' }
      },
      required: ['text']
    }
  },
  {
    name: 'generate_uuid',
    description: 'Generate a UUID v4',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'base64_encode',
    description: 'Base64 encode text',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to encode' }
      },
      required: ['text']
    }
  },
  {
    name: 'base64_decode',
    description: 'Base64 decode string',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Base64 string to decode' }
      },
      required: ['text']
    }
  },
  {
    name: 'json_format',
    description: 'Pretty-print or minify JSON',
    inputSchema: {
      type: 'object',
      properties: {
        json: { type: 'string', description: 'JSON string' },
        indent: { type: 'number', default: 2, description: 'Indent spaces (0 for minify)' }
      },
      required: ['json']
    }
  },
  {
    name: 'url_encode',
    description: 'URL encode text',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text']
    }
  },
  {
    name: 'url_decode',
    description: 'URL decode text',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text']
    }
  },
  {
    name: 'text_diff',
    description: 'Compare two texts and show differences',
    inputSchema: {
      type: 'object',
      properties: {
        text1: { type: 'string', description: 'Original text' },
        text2: { type: 'string', description: 'Modified text' }
      },
      required: ['text1', 'text2']
    }
  },
  {
    name: 'csv_to_json',
    description: 'Convert CSV text to JSON array',
    inputSchema: {
      type: 'object',
      properties: {
        csv: { type: 'string', description: 'CSV data with headers' },
        delimiter: { type: 'string', default: ',' }
      },
      required: ['csv']
    }
  },
  {
    name: 'json_to_csv',
    description: 'Convert JSON array to CSV',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'array', description: 'Array of objects' }
      },
      required: ['data']
    }
  },
  {
    name: 'generate_qr',
    description: 'Generate QR code as SVG',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text or URL to encode' },
        size: { type: 'number', default: 300 }
      },
      required: ['text']
    }
  },
  {
    name: 'password_generate',
    description: 'Generate a cryptographically secure password',
    inputSchema: {
      type: 'object',
      properties: {
        length: { type: 'number', default: 16, description: '8-64 characters' },
        uppercase: { type: 'boolean', default: true },
        numbers: { type: 'boolean', default: true },
        symbols: { type: 'boolean', default: true }
      }
    }
  },
  {
    name: 'jwt_decode',
    description: 'Decode a JWT token (header + payload)',
    inputSchema: {
      type: 'object',
      properties: { token: { type: 'string' } },
      required: ['token']
    }
  },
  {
    name: 'dns_lookup',
    description: 'Look up DNS records for a domain',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string' },
        type: { type: 'string', enum: ['A', 'AAAA', 'MX', 'TXT', 'NS'], default: 'A' }
      },
      required: ['domain']
    }
  },
  {
    name: 'whois_lookup',
    description: 'WHOIS domain registration info',
    inputSchema: {
      type: 'object',
      properties: { domain: { type: 'string' } },
      required: ['domain']
    }
  },
  {
    name: 'ip_info',
    description: 'Get IP address and geolocation info',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'date_calculate',
    description: 'Calculate days between dates or add days to a date',
    inputSchema: {
      type: 'object',
      properties: {
        date1: { type: 'string', description: 'Start date (ISO format)' },
        date2: { type: 'string', description: 'End date (optional)' },
        add: { type: 'number', description: 'Days to add (optional)' }
      },
      required: ['date1']
    }
  },
  {
    name: 'regex_test',
    description: 'Test a regular expression against text',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        text: { type: 'string' },
        flags: { type: 'string', default: 'g' }
      },
      required: ['pattern', 'text']
    }
  },
  {
    name: 'color_convert',
    description: 'Convert color between HEX, RGB, HSL formats',
    inputSchema: {
      type: 'object',
      properties: { color: { type: 'string', description: 'Color in any format (#hex, rgb(), hsl())' } },
      required: ['color']
    }
  },
  {
    name: 'markdown_to_html',
    description: 'Convert Markdown to HTML',
    inputSchema: {
      type: 'object',
      properties: { markdown: { type: 'string' } },
      required: ['markdown']
    }
  },
];

// Tool execution: proxy to the hub API
async function executeTool(name, args) {
  const BASE = 'https://toolsthatdontupload.com';
  
  // Map MCP tool names to API endpoints
  const mapping = {
    hash_text: { path: '/api/hash', method: 'POST', body: args },
    generate_uuid: { path: '/api/uuid', method: 'GET' },
    base64_encode: { path: '/api/base64', method: 'POST', body: { text: args.text, mode: 'encode' } },
    base64_decode: { path: '/api/base64', method: 'POST', body: { text: args.text, mode: 'decode' } },
    json_format: { path: '/api/json-format', method: 'POST', body: args },
    url_encode: { path: '/api/url-encode', method: 'POST', body: args },
    url_decode: { path: '/api/url-decode', method: 'POST', body: args },
    text_diff: { path: '/api/diff', method: 'POST', body: args },
    csv_to_json: { path: '/api/csv-to-json', method: 'POST', body: args },
    json_to_csv: { path: '/api/json-to-csv', method: 'POST', body: args },
    generate_qr: { path: '/api/qr?text=' + encodeURIComponent(args.text || '') + '&size=' + (args.size || 300), method: 'GET' },
    password_generate: { path: '/api/password-gen', method: 'POST', body: args },
    jwt_decode: { path: '/api/jwt-decode', method: 'POST', body: args },
    dns_lookup: { path: '/api/dns-lookup', method: 'POST', body: args },
    whois_lookup: { path: '/api/whois', method: 'POST', body: args },
    ip_info: { path: '/api/ip-info', method: 'GET' },
    date_calculate: { path: '/api/date-calc', method: 'POST', body: args },
    regex_test: { path: '/api/regex-test', method: 'POST', body: args },
    color_convert: { path: '/api/color-convert', method: 'POST', body: args },
    markdown_to_html: { path: '/api/markdown-to-html', method: 'POST', body: args },
  };

  const m = mapping[name];
  if (!m) throw new Error('Unknown tool: ' + name);

  const opts = m.method === 'GET' ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(m.body)
  };

  const resp = await fetch(BASE + m.path, opts);
  const ct = resp.headers.get('content-type') || '';
  
  if (ct.includes('json')) {
    return await resp.json();
  }
  return { result: await resp.text() };
}

// JSON-RPC 2.0 handler
async function handleRPC(body) {
  const { jsonrpc, id, method, params } = body;

  if (jsonrpc !== '2.0') {
    return { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' } };
  }

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: SERVER_INFO,
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
            prompts: { listChanged: false },
          }
        }
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0', id,
        result: { tools: MCP_TOOLS }
      };

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      
      if (!toolName) {
        return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing tool name' } };
      }

      try {
        const result = await executeTool(toolName, toolArgs);
        return {
          jsonrpc: '2.0', id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: false
          }
        };
      } catch (err) {
        return {
          jsonrpc: '2.0', id,
          result: {
            content: [{ type: 'text', text: 'Error: ' + err.message }],
            isError: true
          }
        };
      }
    }


    case 'resources/list':
      return {
        jsonrpc: '2.0', id,
        result: {
          resources: [
            {
              uri: 'https://toolsthatdontupload.com/llms.txt',
              name: 'API Documentation (llms.txt)',
              description: 'Complete API reference with 442 endpoints',
              mimeType: 'text/plain'
            },
            {
              uri: 'https://toolsthatdontupload.com/openapi.json',
              name: 'OpenAPI Specification',
              description: 'OpenAPI 3.0 spec with 442 paths',
              mimeType: 'application/json'
            },
            {
              uri: 'https://toolsthatdontupload.com/privacy/',
              name: 'Privacy Policy',
              description: 'Zero retention privacy policy',
              mimeType: 'text/html'
            }
          ]
        }
      };

    case 'resources/read': {
      const resUri = params?.uri;
      if (!resUri) return { jsonrpc: '2.0', id, error: { code: -32602, message: 'uri required' } };
      try {
        const resResp = await fetch(resUri);
        const resText = await resResp.text();
        return {
          jsonrpc: '2.0', id,
          result: {
            contents: [{ uri: resUri, text: resText.substring(0, 10000), mimeType: resResp.headers.get('content-type') || 'text/plain' }]
          }
        };
      } catch(e) {
        return { jsonrpc: '2.0', id, error: { code: -32603, message: e.message } };
      }
    }

    case 'prompts/list':
      return {
        jsonrpc: '2.0', id,
        result: {
          prompts: [
            {
              name: 'convert_file',
              description: 'Help user convert a file between formats',
              arguments: [
                { name: 'from_format', description: 'Source format (pdf, jpg, csv, json, etc.)', required: true },
                { name: 'to_format', description: 'Target format', required: true }
              ]
            },
            {
              name: 'analyze_data',
              description: 'Analyze data using available tools (hash, validate, parse)',
              arguments: [
                { name: 'data', description: 'The data to analyze', required: true },
                { name: 'task', description: 'What to do: hash, validate, convert, format', required: true }
              ]
            }
          ]
        }
      };

    case 'prompts/get': {
      const promptName = params?.name;
      if (promptName === 'convert_file') {
        return {
          jsonrpc: '2.0', id,
          result: {
            description: 'Convert a file between formats using available tools',
            messages: [
              { role: 'user', content: { type: 'text', text: 'Convert from ' + (params?.arguments?.from_format || '?') + ' to ' + (params?.arguments?.to_format || '?') + '. Available tools: csv_to_json, json_to_csv, base64_encode, base64_decode, url_encode, url_decode, markdown_to_html, json_format.' } }
            ]
          }
        };
      }
      return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Unknown prompt: ' + promptName } };
    }

    case 'notifications/initialized':
      return null; // Notification, no response needed

    default:
      return {
        jsonrpc: '2.0', id,
        error: { code: -32601, message: 'Method not found: ' + method }
      };
  }
}

export default {
  async fetch(request) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    // SSE transport endpoint (for MCP clients)
    if (url.pathname === '/sse' || url.pathname === '/mcp/sse') {
      // For SSE-based MCP transport, return event stream
      // This is a simplified version - full SSE needs streaming
      return new Response('event: endpoint\ndata: /mcp\n\n', {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...CORS
        }
      });
    }

    // Main MCP endpoint  
    if (request.method === 'POST' && (url.pathname === '/mcp' || url.pathname === '/')) {
      try {
        const body = await request.json();
        const result = await handleRPC(body);
        
        if (result === null) {
          return new Response('', { status: 204, headers: CORS });
        }

        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...CORS }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Parse error: ' + err.message }
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS }
        });
      }
    }

    // Discovery endpoint
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/mcp')) {
      return new Response(JSON.stringify({
        name: SERVER_INFO.name,
        version: SERVER_INFO.version,
        description: SERVER_INFO.description,
        transport: 'http',
        endpoint: 'https://mcp.toolsthatdontupload.com/mcp',
        tools: MCP_TOOLS.length,
        protocol: 'MCP/2024-11-05',
        documentation: 'https://toolsthatdontupload.com/llms.txt'
      }, null, 2), {
        headers: { 'Content-Type': 'application/json', ...CORS }
      });
    }

    return new Response('MCP Server - POST /mcp for JSON-RPC', { 
      status: 200, 
      headers: { 'Content-Type': 'text/plain', ...CORS } 
    });
  }
};
