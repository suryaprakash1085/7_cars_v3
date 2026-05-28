#!/usr/bin/env node

/**
 * Unified Production Server
 * 
 * Starts both Frontend and Backend from the build/ directory
 * 
 * This file should be placed in:
 * - build/server.js (or)
 * - build/be/server.js
 * 
 * Usage:
 *   npm run start:prod
 *   node build/server.js
 *   node build/be/server.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the build directory
const scriptDir = __dirname;
let buildDir = scriptDir;

// If this file is in build/be, go up one level to build/
if (scriptDir.includes('build/be') || scriptDir.includes('build\\be')) {
  buildDir = path.dirname(scriptDir);
}

const feDir = path.join(buildDir, 'fe');
const beDir = path.join(buildDir, 'be');

let backend = null;
let frontend = null;
let isShuttingDown = false;

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
};

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

  log.info('Shutting down servers...');

  if (frontend) killProcess(frontend);
  if (backend) killProcess(backend);

  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

// Startup message
console.clear();
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   Vehicle Management System - Production Server            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

log.info(`Build directory: ${buildDir}\n`);

// Verify build structure
console.log('📁 Checking directories:');
const feDirExists = fs.existsSync(feDir);
const beDirExists = fs.existsSync(beDir);

console.log(`   ${feDirExists ? '✓' : '✗'} Frontend: ${feDir}`);
console.log(`   ${beDirExists ? '✓' : '✗'} Backend: ${beDir}\n`);

if (!feDirExists || !beDirExists) {
  log.error('Build directories not found!');
  log.info('\nPlease run: npm run build\n');
  process.exit(1);
}

// Start Backend first
// log.info('Starting Backend on port 9005...');
backend = spawn('node', ['index.js'], {
  cwd: beDir,
  env: {
    ...process.env,
    // PORT: '9005',
    NODE_ENV: 'production'
  },
  stdio: 'inherit'
});

backend.on('error', (error) => {
  log.error(`Backend error: ${error.message}`);
  if (!isShuttingDown) shutdown();
});

backend.on('exit', (code) => {
  if (!isShuttingDown) {
    if (code === 0) {
      log.info('Backend stopped normally');
    } else {
      log.error(`Backend exited with code ${code}`);
    }
    shutdown();
  }
});

// Start Frontend after a delay
setTimeout(() => {
  if (isShuttingDown) return;

  log.info('Starting Frontend on port 3000...');
  startFrontend();
}, 2000);

const startFrontend = () => {
  frontend = spawn('node', ['server.js'], {
    cwd: feDir,
    env: {
      ...process.env,
      NODE_ENV: 'production'
    },
    stdio: 'inherit'
  });

  frontend.on('error', (error) => {
    log.error(`Frontend error: ${error.message}`);
    if (!isShuttingDown) shutdown();
  });

  frontend.on('exit', (code) => {
    if (!isShuttingDown) {
      if (code === 0) {
        log.info('Frontend stopped normally');
      } else {
        log.error(`Frontend exited with code ${code}`);
      }
      shutdown();
    }
  });
};

// Handle signals
process.on('SIGINT', () => {
  console.log('\n');
  shutdown();
});

process.on('SIGTERM', () => {
  console.log('\n');
  shutdown();
});

// Show startup info
setTimeout(() => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    🚀 SERVERS RUNNING                      ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  Frontend:  http://localhost:3000                          ║');
  // console.log('║  Backend:   http://localhost:9005                          ║');
  console.log('║                                                            ║');
  console.log('║  Press Ctrl+C to stop                                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}, 4000);
