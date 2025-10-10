#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testMCPServer() {
  console.log('🧪 Testing MCP Server...\n');

  // Start the MCP server
  const serverProcess = spawn('node', ['server.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: '/Users/rou/Desktop/ui-mcp'
  });

  let serverOutput = '';
  let serverError = '';

  // Collect server output
  serverProcess.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });

  serverProcess.stderr.on('data', (data) => {
    serverError += data.toString();
  });

  // Wait for server to start
  await setTimeout(2000);

  if (serverError) {
    console.log('❌ Server Error:', serverError);
    serverProcess.kill();
    return false;
  }

  // Send MCP initialize request
  const initializeRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  console.log('📤 Sending initialize request...');
  serverProcess.stdin.write(JSON.stringify(initializeRequest) + '\n');

  // Wait for response
  await setTimeout(1000);

  // Send tools/list request
  const toolsListRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };

  console.log('📤 Sending tools/list request...');
  serverProcess.stdin.write(JSON.stringify(toolsListRequest) + '\n');

  // Wait for response
  await setTimeout(1000);

  console.log('\n📊 Server Output:', serverOutput);
  if (serverError) {
    console.log('⚠️  Server Error Output:', serverError);
  }

  // Clean up
  serverProcess.kill();

  // Check if we got expected responses
  const hasInitializeResponse = serverOutput.includes('"id":1');
  const hasToolsListResponse = serverOutput.includes('"id":2');

  console.log('\n✅ Test Results:');
  console.log(`   Initialize response received: ${hasInitializeResponse ? '✅' : '❌'}`);
  console.log(`   Tools list response received: ${hasToolsListResponse ? '✅' : '❌'}`);
  console.log(`   Server started without errors: ${!serverError ? '✅' : '❌'}`);

  return hasInitializeResponse && !serverError;
}

// Run the test
testMCPServer()
  .then(success => {
    console.log(`\n🎯 Overall Test Result: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  });
