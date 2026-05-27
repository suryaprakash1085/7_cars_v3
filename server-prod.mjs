#!/usr/bin/env node

/**
 * Production Server - Starts both Frontend and Backend from build folder
 *
 * This server runs the optimized production builds created by `npm run build`
 *
 * Usage:
 *   npm run start:prod      (Recommended way)
 *   node server-prod.mjs    (Direct execution)
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

const buildDir = path.join(__dirname, 'build');
const feDir = path.join(buildDir, 'fe');
const beDir = path.join(buildDir, 'be');

let backend = null;
let frontend = null;
let isShuttingDown = false;

const killProcess = (proc) => {
  if (proc && !proc.killed) {
    try {
      process.kill(-proc.pid);
    } catch (error) {
      try {
        proc.kill('SIGTERM');
      } catch (err) {
        // Already terminated
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

// Verify build structure exists
console.log('🚀 Starting Vehicle Management System (Production)\n');
console.log('📁 Build directories:');
console.log(`   Frontend: ${feDir}`);
console.log(`   Backend:  ${beDir}\n`);

if (!fs.existsSync(buildDir)) {
  console.error('❌ Build folder not found!');
  console.error(`   Run 'npm run build' first to create the build folder.\n`);
  process.exit(1);
}

if (!fs.existsSync(feDir)) {
  console.error('❌ Frontend build folder not found!');
  console.error(`   Run 'npm run build' first.\n`);
  process.exit(1);
}

if (!fs.existsSync(beDir)) {
  console.error('❌ Backend build folder not found!');
  console.error(`   Run 'npm run build' first.\n`);
  process.exit(1);
}

// Start Backend Server
// console.log('📦 Starting Backend Server on port 9005...');
backend = spawn('node', ['index.js'], {
  cwd: beDir,
  env: {
    ...process.env,
    // PORT: '9005',
    NODE_ENV: 'production'
  },
  stdio: ['inherit', 'inherit', 'inherit']
});

backend.on('error', (error) => {
  console.error('❌ Backend spawn error:', error.message);
  if (!isShuttingDown) {
    shutdown();
  }
});

backend.on('exit', (code, signal) => {
  if (!isShuttingDown) {
    if (code === 0) {
      console.log('\nℹ️  Backend stopped normally');
    } else {
      console.error(`\n❌ Backend process exited unexpectedly (code: ${code})`);
      if (signal) console.error(`   Signal: ${signal}`);
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
  
  // Check if node_modules exists for frontend
  if (!fs.existsSync(path.join(feDir, 'node_modules'))) {
    console.warn('⚠️  Frontend node_modules not found. Installing dependencies...');
    const npm = spawn('npm', ['install', '--production'], {
      cwd: feDir,
      stdio: 'inherit',
      shell: true
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        startFrontend();
      } else {
        console.error('❌ Failed to install frontend dependencies');
        shutdown();
      }
    });
  } else {
    startFrontend();
  }
}, 3000);

const startFrontend = () => {
  frontend = spawn('node', ['server.js'], {
    cwd: feDir,
    env: {
      ...process.env,
      NODE_ENV: 'production'
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
        console.error(`\n❌ Frontend process exited (code: ${code})`);
        if (signal) console.error(`   Signal: ${signal}`);
      }
      shutdown();
    }
  });
};

// Handle process termination signals
process.on('SIGINT', () => {
  console.log('\n');
  shutdown();
});

process.on('SIGTERM', () => {
  console.log('\n');
  shutdown();
});

console.log('\n✅ Servers are starting. Please wait...\n');
console.log('📍 Frontend: http://localhost:3000');
// console.log('📍 Backend API: http://localhost:9005\n');
console.log('⏱️  Frontend will start in ~3 seconds\n');
console.log('💡 Press Ctrl+C to stop all servers\n');
