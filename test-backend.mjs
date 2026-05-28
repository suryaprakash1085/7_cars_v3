#!/usr/bin/env node

/**
 * Backend Diagnostic Script
 * Tests if the backend can start and shows detailed error messages
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.join(__dirname, 'SL_DN_BE_AX_WEBAPP_1125.002');

console.log('🔍 Backend Diagnostic Script\n');
console.log('📁 Backend Directory:', backendDir);
console.log('🔄 Starting backend in development mode...\n');

const backend = spawn('node', ['index.js'], {
  cwd: backendDir,
  env: {
    ...process.env,
    PORT: '8080',
    NODE_ENV: 'development'
  },
  stdio: 'inherit'
});

let hasExited = false;

backend.on('error', (error) => {
  console.error('\n❌ Backend error event:', error);
  hasExited = true;
  process.exit(1);
});

backend.on('exit', (code, signal) => {
  if (!hasExited) {
    hasExited = true;
    console.error(`\n❌ Backend exited with code: ${code}, signal: ${signal}`);
    process.exit(code || 1);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Stopping backend diagnostic...');
  backend.kill();
  process.exit(0);
});

setTimeout(() => {
  if (!hasExited) {
    console.log('\n  Backend has been running for 10 seconds without crashing. It should be working!');
    console.log('📍 Backend API should be available at http://localhost:8080\n');
    console.log('Press Ctrl+C to stop the backend.\n');
  }
}, 10000);
