#!/usr/bin/env node

/**
 * Unified Server - Starts both Frontend (Next.js) and Backend (Express)
 *
 * Usage:
 *   node server.mjs          - Runs both in development mode
 *   npm run start            - Recommended way to run (uses npm scripts)
 *
 * Ports:
 *   Frontend: http://localhost:3000
 *   Backend:  http://localhost:9005
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.join(__dirname, 'SL_DN_FE_AX_WEBAPP_1125.002');
const backendDir = path.join(__dirname, 'SL_DN_BE_AX_WEBAPP_1125.002');

let backend = null;
let frontend = null;
let isShuttingDown = false;

const killProcess = (proc) => {
  if (proc && !proc.killed) {
    try {
      process.kill(-proc.pid); // Kill process group
    } catch (error) {
      try {
        proc.kill('SIGTERM');
      } catch (err) {
        // Process already terminated
      }
    }
  }
};

const shutdown = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n⏹️  Shutting down servers...');

  if (frontend) killProcess(frontend);
  if (backend) killProcess(backend);

  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

// Verify environment and directories
console.log('🚀 Starting Vehicle Management System...\n');
console.log('📁 Directories:');
console.log(`   Frontend: ${frontendDir}`);
console.log(`   Backend:  ${backendDir}\n`);

if (!fs.existsSync(backendDir)) {
  console.error('❌ Backend directory not found:', backendDir);
  process.exit(1);
}

if (!fs.existsSync(frontendDir)) {
  console.error('❌ Frontend directory not found:', frontendDir);
  process.exit(1);
}

// Check if .env files exist
const backendEnv = path.join(backendDir, '.env');
const frontendEnv = path.join(frontendDir, '.env');

console.log('🔐 Environment configuration:');
console.log(`   Backend .env:  ${fs.existsSync(backendEnv) ? '✓ Found' : '✗ Missing'}`);
console.log(`   Frontend .env: ${fs.existsSync(frontendEnv) ? '✓ Found' : '✗ Missing'}\n`);

// Start Backend Server
// console.log('📦 Starting Backend Server on port 9005...');
backend = spawn('node', ['index.js'], {
  cwd: backendDir,
  env: {
    ...process.env,
    // PORT: '9005',
    NODE_ENV: 'development'
  },
  stdio: ['inherit', 'inherit', 'inherit']
});

backend.on('error', (error) => {
  console.error('❌ Backend spawn error:', error.message);
  if (!isShuttingDown) {
    console.error('   This usually means Node.js cannot find or execute the index.js file');
    shutdown();
  }
});

backend.on('exit', (code, signal) => {
  if (!isShuttingDown) {
    if (code === 0) {
      console.log('\nℹ️  Backend stopped normally');
    } else {
      console.error(`\n❌ Backend process exited unexpectedly`);
      console.error(`   Exit code: ${code}`);
      if (signal) console.error(`   Signal: ${signal}`);
      console.error('\n💡 Troubleshooting:');
      // console.error('   1. Check if port 9005 is already in use');
      console.error('   2. Verify database connection: 192.168.31.184:3306');
      console.error('   3. Check .env file in SL_DN_BE_AX_WEBAPP_1125.002/');
      console.error('   4. Try running: node test-backend.mjs (for detailed diagnostics)');
    }
    shutdown();
  }
});

// Wait for backend to start, then start Frontend
let frontendStarted = false;
setTimeout(() => {
  if (isShuttingDown || frontendStarted) return;
  frontendStarted = true;
  
  console.log('\n🎨 Starting Frontend Server on port 3000...');
  frontend = spawn('node', ['server.js'], {
    cwd: frontendDir,
    env: {
      ...process.env,
      NODE_ENV: 'development'
    },
    stdio: ['inherit', 'inherit', 'inherit']
  });

  frontend.on('error', (error) => {
    console.error('❌ Frontend spawn error:', error.message);
    if (!isShuttingDown) {
      shutdown();
    }
  });

  frontend.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      if (code === 0) {
        console.log('\nℹ️  Frontend stopped normally');
      } else {
        console.error(`\n❌ Frontend process exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`);
      }
      shutdown();
    }
  });
}, 3000);

// Handle process termination signals
process.on('SIGINT', () => {
  console.log('\n');
  shutdown();
});

process.on('SIGTERM', () => {
  console.log('\n');
  shutdown();
});

console.log('\n  Servers are starting. Please wait...\n');
console.log('📍 Frontend: http://localhost:3000');
// console.log('📍 Backend API: http://localhost:9005\n');
console.log('⏱️  Frontend will start in ~3 seconds\n');
console.log('💡 Press Ctrl+C to stop all servers\n');
