#!/usr/bin/env node

const autocannon = require('autocannon');
const http = require('http');

const baseConfig = {
  url: 'http://localhost:3001',
  connections: 200,
  duration: 60,
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJ0ZW5hbnRJZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAxMCIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1NTcxMjQ1MiwiZXhwIjoxNzU1NzEzMzUyfQ.vL6qhsZWkFxTJQCa3tU5A2eu27061znmR7l3IDZ6Tmg'
  }
};

// Función para validar el token antes de ejecutar las pruebas
async function validateToken() {
  return new Promise((resolve) => {
    console.log('🔐 Validando token de autenticación...');
    
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/properties/search?status=disponible',
      method: 'GET',
      headers: {
        'Authorization': baseConfig.headers.Authorization
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Token válido\n');
          resolve(true);
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.log('❌ Token inválido o expirado');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
          resolve(false);
        } else {
          console.log('⚠️  Token validation inconclusive');
          console.log(`   Status: ${res.statusCode}`);
          resolve(true); // Continuamos por si es otro tipo de error
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Error de conexión:', error.message);
      console.log('   Verifica que el servidor esté ejecutándose en localhost:3001');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Timeout validando token - servidor no responde');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testEndpoint(name, url, sloTarget = null, noCache = false) {
  console.log(`🎯 ${name}`);
  console.log(`📋 200 conexiones, 60s duración\n`);
  
  const testConfig = {
    ...baseConfig,
    url: baseConfig.url + url,
    headers: {
      ...baseConfig.headers,
      ...(noCache && {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      })
    }
  };
  
  try {
    const result = await autocannon(testConfig);
    
    const errorRate = (result.errors / result.requests.total) * 100;
    const p95 = result.latency.p97_5;
    
    console.log(`📊 RESULTADOS:`);
    console.log(`   p95: ${p95}ms`);
    console.log(`   p99: ${result.latency.p99}ms`);
    console.log(`   Mean: ${result.latency.mean}ms`);
    console.log(`   Throughput: ${result.throughput.mean.toFixed(0)} req/s`);
    console.log(`   Total Requests: ${result.requests.total}`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   Error Rate: ${errorRate.toFixed(2)}%`);
    
    // Chequear específicamente errores de autenticación
    const authErrors = result.errors > 0 && result.requests.total > 0 ? 
      (result.errors / result.requests.total) * 100 : 0;
    
    if (authErrors > 0) {
      console.log(`🔴 ALERTA: ${authErrors.toFixed(2)}% de errores (posible token inválido)`);
    }
    
    // Validar SLOs
    const sloErrorRate = errorRate <= 1;
    console.log(`\n🎯 SLO Validation:`);
    console.log(`   Error Rate ≤ 1%: ${sloErrorRate ? '✅' : '❌'} (${errorRate.toFixed(2)}%)`);
    
    if (sloTarget) {
      const sloLatency = p95 <= sloTarget;
      console.log(`   p95 ≤ ${sloTarget}ms: ${sloLatency ? '✅' : '❌'} (${p95}ms)`);
    }
    
    console.log('='.repeat(60));
    
    return { 
      result, 
      sloMet: sloErrorRate && (sloTarget ? p95 <= sloTarget : true),
      hasAuthErrors: authErrors > 0
    };
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return { result: null, sloMet: false, hasAuthErrors: true };
  }
}

async function runSimpleRealisticTests() {
  console.log('🚀 RED ATLAS EXPRESS - SIMPLE REALISTIC TESTS\n');
  
  // Validar token primero
  const tokenValid = await validateToken();
  if (!tokenValid) {
    console.log('❌ No se pueden ejecutar las pruebas - Token inválido');
    process.exit(1);
  }
  
  console.log('📋 Condiciones: 200 conexiones, 60s, endpoints principales\n');
  
  const tests = [
    { 
      name: 'PROPERTIES - Sin Cache', 
      url: `/api/properties/search?status=disponible&tipo=casa&ciudad=Córdoba&ambientes=5&orderBy=superficie&orderDirection=ASC&_nocache=${Date.now()}`, 
      slo: 800,
      noCache: true
    },
    { 
      name: 'PROPERTIES - Con Cache', 
      url: '/api/properties/search?status=disponible&tipo=casa&ciudad=Córdoba&ambientes=5&orderBy=superficie&orderDirection=ASC', 
      slo: 300,
      noCache: false
    },
    { 
      name: 'LISTINGS - Search', 
      url: '/api/listings/search?status=activo&tipo=venta', 
      slo: null,
      noCache: true
    },
    { 
      name: 'TRANSACTIONS - Search', 
      url: '/api/transactions/search?status=pendiente', 
      slo: null,
      noCache: true
    }
  ];
  
  const results = [];
  let hasAuthIssues = false;
  
  for (const test of tests) {
    const result = await testEndpoint(
      test.name, 
      test.url, 
      test.slo, 
      test.noCache
    );
    results.push({ name: test.name, ...result });
    if (result.hasAuthErrors) {
      hasAuthIssues = true;
    }
  }
  
  // Resumen final
  console.log(`\n🏆 RESUMEN FINAL:`);
  let allPassed = true;
  
  results.forEach(({ name, sloMet, result, hasAuthErrors }) => {
    if (result) {
      const errorRate = (result.errors / result.requests.total) * 100;
      const p95 = result.latency.p97_5;
      const status = hasAuthErrors ? '🔴 AUTH ERROR' : (sloMet ? '✅' : '❌');
      console.log(`   ${name}: p95=${p95}ms, errors=${errorRate.toFixed(2)}% ${status}`);
      allPassed = allPassed && sloMet && !hasAuthErrors;
    } else {
      console.log(`   ${name}: ❌ FAILED`);
      allPassed = false;
    }
  });
  
  if (hasAuthIssues) {
    console.log(`\n🔴 PROBLEMAS DE AUTENTICACIÓN DETECTADOS`);
    console.log(`   Verifica que el token sea válido y no esté expirado`);
  }
  
  console.log(`\n🎯 RESULTADO GLOBAL: ${allPassed ? '✅ SLOs CUMPLIDOS' : '❌ SLOs NO CUMPLIDOS'}`);
}

if (require.main === module) {
  runSimpleRealisticTests();
}

module.exports = { runSimpleRealisticTests };