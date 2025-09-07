// check-cors.js - Check CORS consistency across all API files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORS patterns to check
const CORS_PATTERNS = {
  // Standard CORS headers that should be present
  allowOrigin: /res\.setHeader\(['"]Access-Control-Allow-Origin['"]/,
  allowMethods: /res\.setHeader\(['"]Access-Control-Allow-Methods['"]/,
  allowHeaders: /res\.setHeader\(['"]Access-Control-Allow-Headers['"]/,
  allowCredentials: /res\.setHeader\(['"]Access-Control-Allow-Credentials['"]/,
  
  // OPTIONS handling
  optionsCheck: /if\s*\(\s*req\.method\s*===?\s*['"]OPTIONS['"]\s*\)/,
  optionsReturn: /return\s+res\.status\(200\)\.end\(\)/,
  
  // Common CORS values
  originWildcard: /Access-Control-Allow-Origin['"]\s*,\s*['"]\*/,
  methodsList: /Access-Control-Allow-Methods['"]\s*,\s*['"].*(?:POST|GET|OPTIONS)/,
  headersList: /Access-Control-Allow-Headers['"]\s*,\s*['"].*Content-Type/
};

// Expected CORS configuration
const EXPECTED_CORS = {
  headers: [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers'
  ],
  optionsHandling: true,
  values: {
    methods: ['GET', 'POST', 'OPTIONS'],
    headers: ['Content-Type']
  }
};

function checkFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Checking: ${fileName}`);
  console.log('─'.repeat(50));
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    const found = {};
    
    // Check for each CORS pattern
    for (const [key, pattern] of Object.entries(CORS_PATTERNS)) {
      found[key] = pattern.test(content);
    }
    
    // Check for required headers
    if (!found.allowOrigin) {
      issues.push('❌ Missing Access-Control-Allow-Origin header');
    } else {
      console.log('✅ Access-Control-Allow-Origin header found');
    }
    
    if (!found.allowMethods) {
      issues.push('❌ Missing Access-Control-Allow-Methods header');
    } else {
      console.log('✅ Access-Control-Allow-Methods header found');
    }
    
    if (!found.allowHeaders) {
      issues.push('❌ Missing Access-Control-Allow-Headers header');
    } else {
      console.log('✅ Access-Control-Allow-Headers header found');
    }
    
    // Check OPTIONS handling
    if (!found.optionsCheck) {
      issues.push('⚠️  No OPTIONS method check found');
    } else {
      console.log('✅ OPTIONS method handling found');
      
      if (!found.optionsReturn) {
        issues.push('⚠️  OPTIONS method may not return 200 status');
      }
    }
    
    // Check for consistency in values
    if (found.originWildcard) {
      console.log('📍 Using wildcard (*) for Allow-Origin');
    }
    
    // Extract actual CORS values
    const corsValues = extractCorsValues(content);
    console.log('\n📊 CORS Configuration:');
    console.log('  Origin:', corsValues.origin || 'Not found');
    console.log('  Methods:', corsValues.methods || 'Not found');
    console.log('  Headers:', corsValues.headers || 'Not found');
    
    // Return report
    return {
      file: fileName,
      path: filePath,
      issues: issues,
      corsPresent: found.allowOrigin && found.allowMethods && found.allowHeaders,
      optionsHandled: found.optionsCheck && found.optionsReturn,
      values: corsValues
    };
    
  } catch (err) {
    console.error(`❌ Error reading file: ${err.message}`);
    return {
      file: fileName,
      error: err.message
    };
  }
}

function extractCorsValues(content) {
  const values = {};
  
  // Extract Origin value
  const originMatch = content.match(/Access-Control-Allow-Origin['"]\s*,\s*['"]([^'"]+)/);
  if (originMatch) values.origin = originMatch[1];
  
  // Extract Methods value
  const methodsMatch = content.match(/Access-Control-Allow-Methods['"]\s*,\s*['"]([^'"]+)/);
  if (methodsMatch) values.methods = methodsMatch[1];
  
  // Extract Headers value
  const headersMatch = content.match(/Access-Control-Allow-Headers['"]\s*,\s*['"]([^'"]+)/);
  if (headersMatch) values.headers = headersMatch[1];
  
  return values;
}

function checkAllAPIs() {
  console.log('🔍 CORS Consistency Check');
  console.log('='.repeat(50));
  
  const apiDir = path.join(__dirname, 'api');
  
  // Get all .js files in api directory
  const apiFiles = fs.readdirSync(apiDir)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(apiDir, file));
  
  console.log(`\nFound ${apiFiles.length} API files to check\n`);
  
  const reports = [];
  
  // Check each file
  for (const file of apiFiles) {
    const report = checkFile(file);
    reports.push(report);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  
  const consistent = reports.filter(r => r.corsPresent && r.optionsHandled);
  const inconsistent = reports.filter(r => !r.corsPresent || !r.optionsHandled);
  const errors = reports.filter(r => r.error);
  
  console.log(`\n✅ Properly configured: ${consistent.length}/${reports.length}`);
  consistent.forEach(r => console.log(`   - ${r.file}`));
  
  if (inconsistent.length > 0) {
    console.log(`\n⚠️  Need attention: ${inconsistent.length}/${reports.length}`);
    inconsistent.forEach(r => {
      console.log(`   - ${r.file}`);
      r.issues?.forEach(issue => console.log(`     ${issue}`));
    });
  }
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors: ${errors.length}`);
    errors.forEach(r => console.log(`   - ${r.file}: ${r.error}`));
  }
  
  // Check for value consistency
  console.log('\n🔄 Value Consistency Check:');
  const uniqueOrigins = [...new Set(reports.map(r => r.values?.origin).filter(Boolean))];
  const uniqueMethods = [...new Set(reports.map(r => r.values?.methods).filter(Boolean))];
  const uniqueHeaders = [...new Set(reports.map(r => r.values?.headers).filter(Boolean))];
  
  console.log('  Unique Origin values:', uniqueOrigins);
  console.log('  Unique Methods values:', uniqueMethods);
  console.log('  Unique Headers values:', uniqueHeaders);
  
  if (uniqueOrigins.length > 1 || uniqueMethods.length > 1 || uniqueHeaders.length > 1) {
    console.log('\n⚠️  WARNING: Inconsistent CORS values detected across files!');
  } else {
    console.log('\n✅ All files use consistent CORS values');
  }
  
  return reports;
}

// Run the check
checkAllAPIs();