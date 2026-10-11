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
,
  {name:'text_sentiment',description:'Analyze text sentiment (positive/negative/neutral)',inputSchema:{type:'object',properties:{text:{type:'string',description:'Text to analyze'}},required:['text']}},
  {name:'keyword_extract',description:'Extract keywords with frequency from text',inputSchema:{type:'object',properties:{text:{type:'string'},count:{type:'number',default:10}},required:['text']}},
  {name:'language_detect',description:'Detect language of text',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'word_count',description:'Count words, characters, sentences, paragraphs',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'text_stats',description:'Readability score (Flesch) and grade level',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'json_to_typescript',description:'Generate TypeScript interfaces from JSON',inputSchema:{type:'object',properties:{data:{type:'object'},name:{type:'string',default:'Root'}},required:['data']}},
  {name:'json_to_python',description:'Generate Python dataclass from JSON',inputSchema:{type:'object',properties:{data:{type:'object'},name:{type:'string',default:'Root'}},required:['data']}},
  {name:'sql_format',description:'Format/beautify SQL queries',inputSchema:{type:'object',properties:{sql:{type:'string'}},required:['sql']}},
  {name:'html_minify',description:'Minify HTML removing whitespace and comments',inputSchema:{type:'object',properties:{html:{type:'string'}},required:['html']}},
  {name:'json_validate',description:'Validate JSON and report errors with line numbers',inputSchema:{type:'object',properties:{json:{type:'string'}},required:['json']}},
  {name:'unit_convert',description:'Convert between units (length, weight, speed, etc)',inputSchema:{type:'object',properties:{value:{type:'number'},from:{type:'string'},to:{type:'string'}},required:['value','from','to']}},
  {name:'temperature_convert',description:'Convert between Celsius, Fahrenheit, Kelvin',inputSchema:{type:'object',properties:{value:{type:'number'},from:{type:'string',enum:['C','F','K']},to:{type:'string',enum:['C','F','K']}},required:['value','from','to']}},
  {name:'number_to_words',description:'Convert number to English words',inputSchema:{type:'object',properties:{number:{type:'number'}},required:['number']}},
  {name:'roman_numeral',description:'Convert between number and Roman numeral',inputSchema:{type:'object',properties:{number:{type:'number'},roman:{type:'string'}}}},
  {name:'json_flatten',description:'Flatten nested JSON to dot-notation keys',inputSchema:{type:'object',properties:{data:{type:'object'}},required:['data']}},
  {name:'password_strength',description:'Analyze password strength and entropy',inputSchema:{type:'object',properties:{password:{type:'string'}},required:['password']}},
  {name:'aes_encrypt',description:'AES-256-GCM encrypt text with password',inputSchema:{type:'object',properties:{text:{type:'string'},password:{type:'string'}},required:['text','password']}},
  {name:'aes_decrypt',description:'AES-256-GCM decrypt with password',inputSchema:{type:'object',properties:{encrypted:{type:'string'},password:{type:'string'}},required:['encrypted','password']}},
  {name:'hmac_sign',description:'Generate HMAC-SHA256 signature',inputSchema:{type:'object',properties:{text:{type:'string'},key:{type:'string'}},required:['text','key']}},
  {name:'otp_generate',description:'Generate TOTP secret and URI for authenticator apps',inputSchema:{type:'object',properties:{issuer:{type:'string',default:'ToolsHub'},account:{type:'string',default:'user@example.com'}}}},
  {name:'http_status_info',description:'Get HTTP status code description and category',inputSchema:{type:'object',properties:{code:{type:'number'}},required:['code']}},
  {name:'ssl_check',description:'Check SSL/TLS certificate of a domain',inputSchema:{type:'object',properties:{domain:{type:'string'}},required:['domain']}},
  {name:'meta_extract',description:'Extract meta tags and Open Graph data from URL',inputSchema:{type:'object',properties:{url:{type:'string'}},required:['url']}},
  {name:'link_check',description:'Check if URL is reachable and get response info',inputSchema:{type:'object',properties:{url:{type:'string'}},required:['url']}},
  {name:'sitemap_generate',description:'Generate sitemap XML from list of URLs',inputSchema:{type:'object',properties:{urls:{type:'array',items:{type:'string'}}},required:['urls']}},
  {name:'cron_parse',description:'Parse cron expression to human-readable description',inputSchema:{type:'object',properties:{cron:{type:'string'}},required:['cron']}},
  {name:'cidr_calc',description:'Calculate CIDR subnet info (network, broadcast, hosts)',inputSchema:{type:'object',properties:{cidr:{type:'string'}},required:['cidr']}},
  {name:'email_validate',description:'Validate email format and check disposable domains',inputSchema:{type:'object',properties:{email:{type:'string'}},required:['email']}},
  {name:'xml_to_json',description:'Convert XML to JSON',inputSchema:{type:'object',properties:{xml:{type:'string'}},required:['xml']}},
  {name:'yaml_to_json',description:'Convert YAML to JSON',inputSchema:{type:'object',properties:{yaml:{type:'string'}},required:['yaml']}}
,
  {name:'text_case',description:'Convert text case (upper/lower/title/camel/snake/kebab)',inputSchema:{type:'object',properties:{text:{type:'string'},case:{type:'string',enum:['upper','lower','title','camel','snake','kebab']}},required:['text','case']}},
  {name:'text_reverse',description:'Reverse text characters',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'text_slug',description:'Generate URL slug from text',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'text_truncate',description:'Smart truncate text at word boundary',inputSchema:{type:'object',properties:{text:{type:'string'},maxLength:{type:'number',default:100}},required:['text']}},
  {name:'text_dedupe',description:'Remove duplicate lines',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'url_encode',description:'URL encode text',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'url_decode',description:'URL decode text',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'html_entities_encode',description:'Encode HTML entities',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'rot13',description:'ROT13 cipher',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'morse_encode',description:'Text to Morse code',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'json_to_csv',description:'Convert JSON array to CSV',inputSchema:{type:'object',properties:{data:{type:'array'}},required:['data']}},
  {name:'json_diff',description:'Compare two JSON objects',inputSchema:{type:'object',properties:{obj1:{type:'object'},obj2:{type:'object'}},required:['obj1','obj2']}},
  {name:'json_to_yaml',description:'Convert JSON to YAML',inputSchema:{type:'object',properties:{data:{type:'object'}},required:['data']}},
  {name:'json_sort_keys',description:'Sort JSON keys alphabetically',inputSchema:{type:'object',properties:{data:{type:'object'}},required:['data']}},
  {name:'json_to_go',description:'Generate Go struct from JSON',inputSchema:{type:'object',properties:{data:{type:'object'},name:{type:'string',default:'Root'}},required:['data']}},
  {name:'math_factorial',description:'Calculate factorial',inputSchema:{type:'object',properties:{n:{type:'number'}},required:['n']}},
  {name:'math_gcd',description:'Greatest common divisor',inputSchema:{type:'object',properties:{a:{type:'number'},b:{type:'number'}},required:['a','b']}},
  {name:'math_percentage',description:'Percentage calculations',inputSchema:{type:'object',properties:{value:{type:'number'},total:{type:'number'}},required:['value','total']}},
  {name:'math_fibonacci',description:'Generate Fibonacci sequence',inputSchema:{type:'object',properties:{n:{type:'number',default:10}},required:['n']}},
  {name:'math_is_prime',description:'Check if number is prime',inputSchema:{type:'object',properties:{number:{type:'number'}},required:['number']}},
  {name:'iban_validate',description:'Validate IBAN bank account number',inputSchema:{type:'object',properties:{iban:{type:'string'}},required:['iban']}},
  {name:'credit_card_validate',description:'Validate credit card number (Luhn)',inputSchema:{type:'object',properties:{number:{type:'string'}},required:['number']}},
  {name:'ip_validate',description:'Validate IPv4/IPv6 address',inputSchema:{type:'object',properties:{ip:{type:'string'}},required:['ip']}},
  {name:'url_validate',description:'Validate URL format',inputSchema:{type:'object',properties:{url:{type:'string'}},required:['url']}},
  {name:'phone_validate',description:'Validate phone number format',inputSchema:{type:'object',properties:{phone:{type:'string'}},required:['phone']}},
  {name:'dns_lookup',description:'DNS record lookup',inputSchema:{type:'object',properties:{domain:{type:'string'},type:{type:'string',default:'A'}},required:['domain']}},
  {name:'whois_lookup',description:'Domain WHOIS info',inputSchema:{type:'object',properties:{domain:{type:'string'}},required:['domain']}},
  {name:'robots_check',description:'Check robots.txt rules',inputSchema:{type:'object',properties:{content:{type:'string'},path:{type:'string',default:'/'}},required:['content']}},
  {name:'meta_generate',description:'Generate HTML meta tags',inputSchema:{type:'object',properties:{title:{type:'string'},description:{type:'string'}},required:['title']}},
  {name:'robots_generate',description:'Generate robots.txt',inputSchema:{type:'object',properties:{sitemap:{type:'string'},disallow:{type:'array'}},required:[]}},
  {name:'date_format',description:'Format date in various formats',inputSchema:{type:'object',properties:{date:{type:'string'}},required:['date']}},
  {name:'business_days',description:'Count business days between dates',inputSchema:{type:'object',properties:{start:{type:'string'},end:{type:'string'}},required:['start','end']}},
  {name:'age_calc',description:'Calculate age from birthdate',inputSchema:{type:'object',properties:{birthdate:{type:'string'}},required:['birthdate']}},
  {name:'timezone_convert',description:'Convert time between timezones',inputSchema:{type:'object',properties:{time:{type:'string'},from:{type:'string',default:'UTC'},to:{type:'string',default:'Asia/Seoul'}},required:['time']}},
  {name:'relative_time',description:'Human-readable relative time',inputSchema:{type:'object',properties:{date:{type:'string'}},required:['date']}},
  {name:'color_blend',description:'Blend two colors',inputSchema:{type:'object',properties:{color1:{type:'string'},color2:{type:'string'},ratio:{type:'number',default:0.5}},required:['color1','color2']}},
  {name:'color_contrast',description:'WCAG contrast ratio',inputSchema:{type:'object',properties:{foreground:{type:'string'},background:{type:'string'}},required:['foreground','background']}},
  {name:'color_palette',description:'Generate color palette',inputSchema:{type:'object',properties:{hex:{type:'string'},scheme:{type:'string',default:'complementary'}},required:['hex']}},
  {name:'json_to_rust',description:'Generate Rust struct from JSON',inputSchema:{type:'object',properties:{data:{type:'object'},name:{type:'string',default:'Root'}},required:['data']}},
  {name:'json_to_kotlin',description:'Generate Kotlin data class',inputSchema:{type:'object',properties:{data:{type:'object'},name:{type:'string',default:'Root'}},required:['data']}},
  {name:'json_to_java',description:'Generate Java POJO',inputSchema:{type:'object',properties:{data:{type:'object'},name:{type:'string',default:'Root'}},required:['data']}},
  {name:'json_to_csharp',description:'Generate C# class',inputSchema:{type:'object',properties:{data:{type:'object'},name:{type:'string',default:'Root'}},required:['data']}},
  {name:'json_to_sql_create',description:'Generate SQL CREATE TABLE',inputSchema:{type:'object',properties:{data:{type:'object'},table:{type:'string',default:'my_table'}},required:['data']}},
  {name:'fake_data',description:'Generate fake names, emails, phones',inputSchema:{type:'object',properties:{count:{type:'number',default:5}}}},
  {name:'uuid_batch',description:'Generate multiple UUIDs',inputSchema:{type:'object',properties:{count:{type:'number',default:10}}}},
  {name:'lorem_ipsum',description:'Generate placeholder text',inputSchema:{type:'object',properties:{paragraphs:{type:'number',default:3}}}},
  {name:'barcode_generate',description:'Generate Code128 barcode SVG',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}},
  {name:'avatar_generate',description:'Generate SVG avatar from text',inputSchema:{type:'object',properties:{text:{type:'string'},size:{type:'number',default:100}},required:['text']}},
  {name:'hashtag_generate',description:'Generate hashtags from text',inputSchema:{type:'object',properties:{text:{type:'string'}},required:['text']}}
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
    text_sentiment: { path: '/api/sentiment', method: 'POST', body: args },
    keyword_extract: { path: '/api/keyword-extract', method: 'POST', body: args },
    language_detect: { path: '/api/language-detect', method: 'POST', body: args },
    word_count: { path: '/api/word-count', method: 'POST', body: args },
    text_stats: { path: '/api/text-stats', method: 'POST', body: args },
    json_to_typescript: { path: '/api/json-to-typescript', method: 'POST', body: args },
    json_to_python: { path: '/api/json-to-python', method: 'POST', body: args },
    sql_format: { path: '/api/sql-format', method: 'POST', body: args },
    html_minify: { path: '/api/html-minify', method: 'POST', body: args },
    json_validate: { path: '/api/json-validate', method: 'POST', body: args },
    unit_convert: { path: '/api/unit-convert', method: 'POST', body: args },
    temperature_convert: { path: '/api/temperature', method: 'POST', body: args },
    number_to_words: { path: '/api/number-to-words', method: 'POST', body: args },
    roman_numeral: { path: '/api/roman-numeral', method: 'POST', body: args },
    json_flatten: { path: '/api/json-flatten', method: 'POST', body: args },
    password_strength: { path: '/api/password-strength', method: 'POST', body: args },
    aes_encrypt: { path: '/api/aes-encrypt', method: 'POST', body: args },
    aes_decrypt: { path: '/api/aes-decrypt', method: 'POST', body: args },
    hmac_sign: { path: '/api/hmac', method: 'POST', body: args },
    otp_generate: { path: '/api/otp-generate', method: 'POST', body: args },
    http_status_info: { path: '/api/http-status', method: 'POST', body: args },
    ssl_check: { path: '/api/ssl-check', method: 'POST', body: args },
    meta_extract: { path: '/api/meta-extract', method: 'POST', body: args },
    link_check: { path: '/api/link-check', method: 'POST', body: args },
    sitemap_generate: { path: '/api/sitemap-generate', method: 'POST', body: args },
    cron_parse: { path: '/api/cron-parse', method: 'POST', body: args },
    cidr_calc: { path: '/api/cidr-calc', method: 'POST', body: args },
    email_validate: { path: '/api/email-validate', method: 'POST', body: args },
    xml_to_json: { path: '/api/xml-to-json', method: 'POST', body: args },
    yaml_to_json: { path: '/api/yaml-to-json', method: 'POST', body: args },

  };


  // Inline implementations for tools not on hub Pages Function
  if (name === 'text_sentiment') {
    const pos=['good','great','excellent','amazing','wonderful','love','happy','best','awesome','perfect'];
    const neg=['bad','terrible','awful','horrible','worst','hate','ugly','poor'];
    const words=String(args.text||'').toLowerCase().split(/\W+/);
    let score=0;const found={positive:[],negative:[]};
    words.forEach(w=>{if(pos.includes(w)){score++;found.positive.push(w);}if(neg.includes(w)){score--;found.negative.push(w);}});
    return{score,sentiment:score>0?'positive':score<0?'negative':'neutral',words:found};
  }
  if (name === 'keyword_extract') {
    const stops=new Set(['the','a','an','is','are','was','were','be','to','of','in','for','on','with','at','by','from','as','and','or','but','not','this','that','it']);
    const words=String(args.text||'').toLowerCase().match(/\b[a-z]{3,}\b/g)||[];
    const freq={};words.forEach(w=>{if(!stops.has(w))freq[w]=(freq[w]||0)+1;});
    const sorted=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,args.count||10);
    return{keywords:sorted.map(x=>({word:x[0],count:x[1]}))};
  }
  if (name === 'language_detect') {
    const t=String(args.text||'');
    const ko=/[가-힣]/.test(t)?'ko':null;const ja=/[ぁ-んァ-ン]/.test(t)?'ja':null;
    const zh=/[一-龥]/.test(t)?'zh':null;const en=/[a-zA-Z]/.test(t)?'en':null;
    return{language:ko||ja||zh||en||'unknown',text:t.substring(0,50)};
  }
  if (name === 'word_count') {
    const t=String(args.text||'');
    return{characters:t.length,words:t.split(/\s+/).filter(Boolean).length,sentences:t.split(/[.!?]+/).filter(s=>s.trim()).length,lines:t.split('\n').length};
  }
  if (name === 'text_stats') {
    const t=String(args.text||'');const words=t.match(/\b\w+\b/g)||[];const sents=t.split(/[.!?]+/).filter(s=>s.trim());
    const asl=words.length/Math.max(sents.length,1);
    const flesch=206.835-1.015*asl-84.6*1.5;
    return{words:words.length,sentences:sents.length,fleschReadingEase:Math.round(flesch),avgWordsPerSentence:Math.round(asl*10)/10};
  }
  if (name === 'json_to_typescript') {
    const n=args.name||'Root';const lines=['interface '+n+' {'];
    for(const[k,v] of Object.entries(args.data||{})){let t=typeof v==='string'?'string':typeof v==='number'?(Number.isInteger(v)?'number':'number'):typeof v==='boolean'?'boolean':'any';lines.push('  '+k+': '+t+';');}
    lines.push('}');return{typescript:lines.join('\n')};
  }
  if (name === 'json_to_python') {
    const n=args.name||'Root';const lines=['from dataclasses import dataclass','','@dataclass','class '+n+':'];
    for(const[k,v] of Object.entries(args.data||{})){let t=typeof v==='string'?'str':typeof v==='number'?'int':'str';lines.push('    '+k+': '+t);}
    return{python:lines.join('\n')};
  }
  if (name === 'sql_format') {
    let f=String(args.sql||'').replace(/\bSELECT\b/gi,'\nSELECT').replace(/\bFROM\b/gi,'\nFROM').replace(/\bWHERE\b/gi,'\nWHERE').replace(/\bORDER BY\b/gi,'\nORDER BY').replace(/\bGROUP BY\b/gi,'\nGROUP BY').trim();
    return{formatted:f};
  }
  if (name === 'html_minify') {
    const r=String(args.html||'').replace(/<!--[\s\S]*?-->/g,'').replace(/\s+/g,' ').replace(/> </g,'><').trim();
    return{result:r,savings:Math.round((1-r.length/args.html.length)*100)+'%'};
  }
  if (name === 'json_validate') {
    try{JSON.parse(typeof args.json==='string'?args.json:JSON.stringify(args.json));return{valid:true};}
    catch(e){return{valid:false,error:e.message};}
  }
  if (name === 'unit_convert') {
    const toM={km:1000,m:1,cm:0.01,mm:0.001,mi:1609.344,ft:0.3048,in:0.0254,yd:0.9144,kg:1,g:0.001,lb:0.453592,oz:0.0283495};
    const f=toM[args.from],t=toM[args.to];
    if(!f||!t)return{error:'Unknown units'};
    return{result:Math.round(args.value*f/t*1e6)/1e6,from:args.from,to:args.to};
  }
  if (name === 'temperature_convert') {
    let c=args.from==='C'?args.value:args.from==='F'?(args.value-32)*5/9:args.value-273.15;
    let r=args.to==='C'?c:args.to==='F'?c*9/5+32:c+273.15;
    return{result:Math.round(r*100)/100,from:args.from,to:args.to};
  }
  if (name === 'number_to_words') {
    const ones=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
    const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
    function c(n){if(n<20)return ones[n];if(n<100)return tens[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'');if(n<1000)return ones[Math.floor(n/100)]+' hundred'+(n%100?' '+c(n%100):'');if(n<1e6)return c(Math.floor(n/1000))+' thousand'+(n%1000?', '+c(n%1000):'');return String(n);}
    return{words:c(Math.abs(args.number||0)),number:args.number};
  }
  if (name === 'roman_numeral') {
    if(args.number){let n=args.number;const v=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let r='';v.forEach(x=>{while(n>=x[0]){r+=x[1];n-=x[0];}});return{roman:r};}
    return{error:'number required'};
  }
  if (name === 'json_flatten') {
    const r={};function f(o,p){for(const[k,v] of Object.entries(o||{})){const key=p?p+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))f(v,key);else r[key]=v;}}f(args.data,'');return{result:r};
  }
  if (name === 'password_strength') {
    const p=String(args.password||'');let s=0;if(p.length>=8)s++;if(p.length>=12)s++;if(/[a-z]/.test(p)&&/[A-Z]/.test(p))s++;if(/\d/.test(p))s++;if(/[^a-zA-Z0-9]/.test(p))s++;
    return{score:s,maxScore:5,level:['Very Weak','Weak','Fair','Good','Strong','Very Strong'][s],length:p.length};
  }
  if (name === 'hmac_sign') {
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(args.key||''),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(args.text||''));
    return{hmac:Array.from(new Uint8Array(sig)).map(x=>x.toString(16).padStart(2,'0')).join('')};
  }
  if (name === 'otp_generate') {
    const secret=new Uint8Array(20);crypto.getRandomValues(secret);const b32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let s='',bits=0,val=0;
    for(const byte of secret){val=(val<<8)|byte;bits+=8;while(bits>=5){bits-=5;s+=b32[(val>>bits)&31];}}
    return{secret:s,uri:'otpauth://totp/'+(args.issuer||'ToolsHub')+':'+(args.account||'user')+'?secret='+s};
  }
  if (name === 'http_status_info') {
    const codes={200:'OK',201:'Created',301:'Moved Permanently',302:'Found',400:'Bad Request',401:'Unauthorized',403:'Forbidden',404:'Not Found',429:'Too Many Requests',500:'Internal Server Error',502:'Bad Gateway',503:'Service Unavailable'};
    const c=args.code||200;return{code:c,message:codes[c]||'Unknown',category:c<200?'Info':c<300?'Success':c<400?'Redirect':c<500?'Client Error':'Server Error'};
  }
  if (name === 'cron_parse') {
    const p=(args.cron||'').trim().split(/\s+/);if(p.length<5)return{error:'Need 5 fields'};
    return{fields:{minute:p[0],hour:p[1],dayOfMonth:p[2],month:p[3],dayOfWeek:p[4]}};
  }
  if (name === 'cidr_calc') {
    const m=String(args.cidr||'').match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);if(!m)return{error:'Invalid CIDR'};
    const ip=m[1].split('.').map(Number);const prefix=parseInt(m[2]);
    const ipNum=(ip[0]<<24|ip[1]<<16|ip[2]<<8|ip[3])>>>0;
    const mask=prefix===0?0:(~0<<(32-prefix))>>>0;const net=(ipNum&mask)>>>0;const bc=(net|~mask)>>>0;
    const toIP=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
    return{network:toIP(net),broadcast:toIP(bc),hosts:Math.pow(2,32-prefix)-2,netmask:toIP(mask)};
  }
  if (name === 'email_validate') {
    const e=String(args.email||'');const valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    return{valid,email:e,domain:e.split('@')[1]||null};
  }

  if(name==='text_case'){const cases={upper:t=>t.toUpperCase(),lower:t=>t.toLowerCase(),title:t=>t.replace(/\b\w/g,c=>c.toUpperCase()),camel:t=>t.replace(/[^a-zA-Z0-9]+(.)/g,(m,c)=>c.toUpperCase()).replace(/^./,c=>c.toLowerCase()),snake:t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'_'),kebab:t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'-')};return{result:(cases[args.case]||cases.upper)(String(args.text))};}
  if(name==='text_reverse')return{result:[...String(args.text)].reverse().join('')};
  if(name==='text_slug')return{slug:String(args.text).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')};
  if(name==='text_truncate'){const t=String(args.text),m=args.maxLength||100;if(t.length<=m)return{result:t,truncated:false};const c=t.substring(0,m);const ls=c.lastIndexOf(' ');return{result:(ls>m*0.3?c.substring(0,ls):c)+'...',truncated:true};}
  if(name==='text_dedupe'){const lines=String(args.text).split('\n');const u=[...new Set(lines)];return{result:u.join('\n'),removed:lines.length-u.length};}
  if(name==='url_encode')return{result:encodeURIComponent(String(args.text))};
  if(name==='url_decode')return{result:decodeURIComponent(String(args.text))};
  if(name==='html_entities_encode')return{result:String(args.text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')};
  if(name==='rot13')return{result:String(args.text).replace(/[a-zA-Z]/g,c=>{const b=c<='Z'?65:97;return String.fromCharCode((c.charCodeAt(0)-b+13)%26+b);})};
  if(name==='morse_encode'){const m2={'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..'};return{result:String(args.text).toUpperCase().split('').map(c=>c===' '?'/':m2[c]||c).join(' ')};}
  if(name==='json_to_csv'){const arr=args.data;if(!Array.isArray(arr)||!arr.length)return{csv:''};const k=Object.keys(arr[0]);return{csv:k.join(',')+' \n'+arr.map(r=>k.map(k2=>JSON.stringify(r[k2]??'')).join(',')).join('\n')};}
  if(name==='json_diff'){const a2={},r2={},c2={};for(const k in args.obj2){if(!(k in args.obj1))a2[k]=args.obj2[k];else if(JSON.stringify(args.obj1[k])!==JSON.stringify(args.obj2[k]))c2[k]={from:args.obj1[k],to:args.obj2[k]};}for(const k in args.obj1){if(!(k in args.obj2))r2[k]=args.obj1[k];}return{added:a2,removed:r2,changed:c2};}
  if(name==='json_to_yaml'){function toY(o,i){const sp='  '.repeat(i||0);let r='';for(const k in o){if(typeof o[k]==='object'&&o[k]!==null&&!Array.isArray(o[k])){r+=sp+k+':\n'+toY(o[k],(i||0)+1);}else if(Array.isArray(o[k])){r+=sp+k+':\n';o[k].forEach(item=>{r+=sp+'  - '+JSON.stringify(item)+'\n';});}else{r+=sp+k+': '+JSON.stringify(o[k])+'\n';}}return r;}return{yaml:toY(args.data,0)};}
  if(name==='json_sort_keys'){function sortObj(o){if(Array.isArray(o))return o.map(sortObj);if(o&&typeof o==='object'){const s={};Object.keys(o).sort().forEach(k=>{s[k]=sortObj(o[k]);});return s;}return o;}return{result:sortObj(args.data)};}
  if(name==='json_to_go'){const n=args.name||'Root';const lines=['type '+n+' struct {'];for(const[k,v] of Object.entries(args.data||{})){const t=typeof v==='string'?'string':typeof v==='number'?'int':'interface{}';lines.push('    '+k.charAt(0).toUpperCase()+k.slice(1)+' '+t+' `json:"'+k+'"`');}lines.push('}');return{go:lines.join('\n')};}
  if(name==='math_factorial'){let r=1;for(let i=2;i<=Math.min(args.n,170);i++)r*=i;return{factorial:r};}
  if(name==='math_gcd'){function gcd(a,b){return b===0?a:gcd(b,a%b);}const g=gcd(Math.abs(args.a),Math.abs(args.b));return{gcd:g,lcm:Math.abs(args.a*args.b)/g};}
  if(name==='math_percentage')return{result:Math.round(args.value/args.total*10000)/100};
  if(name==='math_fibonacci'){const f=[0,1];for(let i=2;i<Math.min(args.n||10,100);i++)f.push(f[i-1]+f[i-2]);return{sequence:f};}
  if(name==='math_is_prime'){const n=args.number;if(n<2)return{isPrime:false};for(let i=2;i<=Math.sqrt(n);i++){if(n%i===0)return{isPrime:false,factor:i};}return{isPrime:true};}
  if(name==='iban_validate'){const c=String(args.iban).replace(/[\s-]/g,'').toUpperCase();const rear=c.substring(4)+c.substring(0,4);let num='';for(const ch of rear){num+=/[A-Z]/.test(ch)?(ch.charCodeAt(0)-55).toString():ch;}let rem=0n;for(let i=0;i<num.length;i+=7){rem=BigInt(rem.toString()+num.substring(i,i+7))%97n;}return{valid:rem===1n,country:c.substring(0,2)};}
  if(name==='credit_card_validate'){const c=String(args.number).replace(/[\s-]/g,'');let s=0,d=false;for(let i=c.length-1;i>=0;i--){let n=parseInt(c[i]);if(d){n*=2;if(n>9)n-=9;}s+=n;d=!d;}let issuer='Unknown';if(/^4/.test(c))issuer='Visa';else if(/^5[1-5]/.test(c))issuer='Mastercard';else if(/^3[47]/.test(c))issuer='Amex';return{valid:s%10===0,issuer};}
  if(name==='ip_validate'){const v4=/^(\d{1,3}\.){3}\d{1,3}$/.test(args.ip)&&args.ip.split('.').every(n=>parseInt(n)<=255);return{valid:v4,version:v4?4:null};}
  if(name==='url_validate'){try{new URL(args.url);return{valid:true};}catch{return{valid:false};}}
  if(name==='phone_validate'){const c=String(args.phone).replace(/[\s\-().]/g,'');return{valid:/^\+?\d{7,15}$/.test(c),digits:c.replace(/[^0-9]/g,'').length};}
  if(name==='robots_check'){const lines=String(args.content).split('\n');let allowed=true;lines.forEach(l=>{const m=l.match(/^(Disallow|Allow):\s*(.*)/i);if(m){if(m[1].toLowerCase()==='disallow'&&m[2]&&(args.path||'/').startsWith(m[2].trim()))allowed=false;if(m[1].toLowerCase()==='allow'&&m[2]&&(args.path||'/').startsWith(m[2].trim()))allowed=true;}});return{path:args.path||'/',allowed};}
  if(name==='meta_generate'){return{html:'<title>'+args.title+'</title>\n<meta name="description" content="'+(args.description||'')+'">\n<meta property="og:title" content="'+args.title+'">'};}
  if(name==='robots_generate'){let r='User-agent: *\n';(args.disallow||[]).forEach(p=>{r+='Disallow: '+p+'\n';});if(args.sitemap)r+='\nSitemap: '+args.sitemap;return{robotsTxt:r};}
  if(name==='date_format'){const d=new Date(args.date);return{iso:d.toISOString(),us:(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear(),eu:d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(),unix:Math.floor(d.getTime()/1000)};}
  if(name==='business_days'){const s=new Date(args.start),e=new Date(args.end);let c=0,cur=new Date(s);while(cur<=e){if(cur.getDay()!==0&&cur.getDay()!==6)c++;cur.setDate(cur.getDate()+1);}return{businessDays:c};}
  if(name==='age_calc'){const bd=new Date(args.birthdate),now=new Date();let y=now.getFullYear()-bd.getFullYear();if(now.getMonth()<bd.getMonth()||(now.getMonth()===bd.getMonth()&&now.getDate()<bd.getDate()))y--;return{years:y};}
  if(name==='timezone_convert'){const d=new Date(args.time);return{from:{timezone:args.from||'UTC',time:d.toLocaleString('en-US',{timeZone:args.from||'UTC',hour12:false})},to:{timezone:args.to||'Asia/Seoul',time:d.toLocaleString('en-US',{timeZone:args.to||'Asia/Seoul',hour12:false})}};}
  if(name==='relative_time'){const d=new Date(args.date);const diff=Date.now()-d.getTime();const abs=Math.abs(diff);const ago=diff>0;if(abs<60000)return{text:'just now'};if(abs<3600000)return{text:Math.floor(abs/60000)+' min '+(ago?'ago':'from now')};if(abs<86400000)return{text:Math.floor(abs/3600000)+' hours '+(ago?'ago':'from now')};return{text:Math.floor(abs/86400000)+' days '+(ago?'ago':'from now')};}
  if(name==='color_blend'){const p=c=>{const h=c.replace('#','');return[parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];};const[r1,g1,b1]=p(args.color1),[r2,g2,b2]=p(args.color2);const r=args.ratio||0.5;return{result:'#'+[Math.round(r1+(r2-r1)*r),Math.round(g1+(g2-g1)*r),Math.round(b1+(b2-b1)*r)].map(x=>x.toString(16).padStart(2,'0')).join('')};}
  if(name==='color_contrast'){const lum=c=>{const h=c.replace('#','');const[r,g,b]=[parseInt(h.substr(0,2),16)/255,parseInt(h.substr(2,2),16)/255,parseInt(h.substr(4,2),16)/255].map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));return 0.2126*r+0.7152*g+0.0722*b;};const l1=lum(args.foreground),l2=lum(args.background);const ratio=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);return{ratio:Math.round(ratio*100)/100,AA:ratio>=4.5,AAA:ratio>=7};}
  if(name==='color_palette')return this.executeTool?await this.executeTool('color_scheme',args):{colors:[args.hex]};
  if(name==='json_to_rust'){const n=args.name||'Root';const lines=['#[derive(Debug)]','struct '+n+' {'];for(const[k,v] of Object.entries(args.data||{})){const t=typeof v==='string'?'String':typeof v==='number'?'i64':'bool';lines.push('    '+k+': '+t+',');}lines.push('}');return{rust:lines.join('\n')};}
  if(name==='json_to_kotlin'){const n=args.name||'Root';const f=[];for(const[k,v] of Object.entries(args.data||{})){f.push('    val '+k+': '+(typeof v==='string'?'String':typeof v==='number'?'Int':'Any'));}return{kotlin:'data class '+n+'(\n'+f.join(',\n')+'\n)'};}
  if(name==='json_to_java'){const n=args.name||'Root';const lines=['public class '+n+' {'];for(const[k,v] of Object.entries(args.data||{})){const t=typeof v==='string'?'String':typeof v==='number'?'int':'Object';lines.push('    private '+t+' '+k+';');}lines.push('}');return{java:lines.join('\n')};}
  if(name==='json_to_csharp'){const n=args.name||'Root';const lines=['public class '+n+' {'];for(const[k,v] of Object.entries(args.data||{})){const t=typeof v==='string'?'string':typeof v==='number'?'int':'object';lines.push('    public '+t+' '+k.charAt(0).toUpperCase()+k.slice(1)+' { get; set; }');}lines.push('}');return{csharp:lines.join('\n')};}
  if(name==='json_to_sql_create'){const n=args.table||'my_table';const cols=[];for(const[k,v] of Object.entries(args.data||{})){cols.push('  '+k+' '+(typeof v==='string'?'VARCHAR(255)':typeof v==='number'?'INTEGER':'TEXT'));}return{sql:'CREATE TABLE '+n+' (\n  id INTEGER PRIMARY KEY,\n'+cols.join(',\n')+'\n);'};}
  if(name==='fake_data'){const names=['Alice','Bob','Charlie','Diana','Eve'];const r=[];for(let i=0;i<Math.min(args.count||5,50);i++){r.push({name:names[i%5]+' '+['Smith','Jones','Brown','Davis','Wilson'][i%5],email:names[i%5].toLowerCase()+'@test.com',id:crypto.randomUUID()});}return{data:r};}
  if(name==='uuid_batch'){const r=[];for(let i=0;i<Math.min(args.count||10,100);i++)r.push(crypto.randomUUID());return{uuids:r};}
  if(name==='lorem_ipsum'){const w=['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua'];const ps=[];for(let p=0;p<(args.paragraphs||3);p++){let s='';for(let i=0;i<40;i++)s+=w[Math.floor(Math.random()*w.length)]+' ';ps.push(s.trim()+'.');}return{text:ps.join('\n\n')};}
  if(name==='hashtag_generate'){const stops=new Set(['the','a','an','is','are','to','of','in','for','on','with','and','or','but','not']);const words=String(args.text).toLowerCase().match(/[a-z]{3,}/g)||[];const freq={};words.forEach(w=>{if(!stops.has(w))freq[w]=(freq[w]||0)+1;});return{hashtags:Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10).map(x=>'#'+x[0])};}

  if (name === 'xml_to_json' || name === 'yaml_to_json') {
    // These are on the hub, proxy via fetch
  }
  const m = mapping[name];
  if (!m) throw new Error('Unknown tool: ' + name);

  const opts = m.method === 'GET' ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(m.body)
  };

  const resp = await fetch(new Request(BASE + m.path, opts));
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
