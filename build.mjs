#!/usr/bin/env node

/**
 * Build Script - Creates optimized production build structure
 * Works on Windows, Mac, and Linux
 * 
 * This script:
 * 1. Creates a build/ directory with fe and be subdirectories
 * 2. Copies frontend source (or built output if available)
 * 3. Copies backend source
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { rm, mkdir, cp, copyFile } from 'fs/promises';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(__dirname, 'build');
const FE_SOURCE = path.join(__dirname, 'SL_DN_FE_AX_WEBAPP_1125.002');
const BE_SOURCE = path.join(__dirname, 'SL_DN_BE_AX_WEBAPP_1125.002');
const FE_BUILD = path.join(BUILD_DIR, 'fe');
const BE_BUILD = path.join(BUILD_DIR, 'be');

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  section: (msg) => console.log(`\n📦 ${msg}\n`),
};

const copyDir = async (src, dest, description, excludeDirs = []) => {
  try {
    await mkdir(dest, { recursive: true });

    // Copy with exclusions
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      // Skip excluded directories
      if (entry.isDirectory() && excludeDirs.includes(entry.name)) {
        continue;
      }

      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await cp(srcPath, destPath, { recursive: true, force: true });
      } else {
        await cp(srcPath, destPath, { force: true });
      }
    }

    log.success(`${description}`);
  } catch (error) {
    log.error(`Failed to copy: ${error.message}`);
    throw error;
  }
};

const safeRemoveDir = async (dirPath) => {
  try {
    if (fs.existsSync(dirPath)) {
      await rm(dirPath, { recursive: true, force: true });
    }
  } catch (error) {
    // Ignore errors - directory might be in use
  }
};

const runCommand = (command, args, cwd, env = {}) => {
  return new Promise((resolve, reject) => {
    log.info(`Running: ${command} ${args.join(' ')}`);

    const proc = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
};

const build = async () => {
  try {
    log.section('🚀 Starting Build Process');

    // Only clean .next and .turbo, preserve everything else (including node_modules)
    log.info('Cleaning cached build artifacts...');
    await safeRemoveDir(path.join(FE_SOURCE, '.next'));
    await safeRemoveDir(path.join(FE_SOURCE, '.turbo'));

    // Only clean build output folders, not node_modules
    await safeRemoveDir(path.join(BUILD_DIR, 'fe', '.next'));
    await safeRemoveDir(path.join(BUILD_DIR, 'be', 'dist'));

    log.success('Cache cleaned');

    // Ensure build directories exist
    await mkdir(FE_BUILD, { recursive: true });
    await mkdir(BE_BUILD, { recursive: true });
    log.success('Build directory ready');

    // Copy Frontend source
    log.section('Preparing Frontend...');
    await copyDir(FE_SOURCE, FE_BUILD, 'Frontend source copied', ['.next', '.turbo', 'node_modules', '.git', 'dist']);

    // Install Frontend dependencies (skip if node_modules exists and package-lock.json matches)
    log.section('Installing Frontend Dependencies...');
    const feNodeModules = path.join(FE_BUILD, 'node_modules');
    const fePackageLock = path.join(FE_BUILD, 'package-lock.json');

    if (!fs.existsSync(feNodeModules) || !fs.existsSync(fePackageLock)) {
      try {
        await runCommand('npm', ['install'], FE_BUILD);
        log.success('Frontend dependencies installed');
      } catch (error) {
        log.error(`Failed to install frontend dependencies: ${error.message}`);
        throw error;
      }
    } else {
      log.success('Frontend dependencies already installed (skipped)');
    }

    // Build Frontend with Next.js
    log.section('Building Frontend with Next.js...');
    log.info('This may take 2-3 minutes...');
    try {
      await runCommand('next', ['build'], FE_BUILD, {
        NODE_ENV: 'production',
      });
      log.success('Frontend built successfully');
    } catch (error) {
      log.error(`Frontend build failed: ${error.message}`);
      throw error;
    }

    // Verify .next folder exists
    const nextBuild = path.join(FE_BUILD, '.next');
    if (!fs.existsSync(nextBuild)) {
      throw new Error('Frontend .next directory not found after build. The build may have failed.');
    }
    log.success('Build output verified (.next folder exists)');

    // Copy Backend
    log.section('Preparing Backend...');
    await copyDir(BE_SOURCE, BE_BUILD, 'Backend source copied', ['node_modules', '.git', 'dist']);

    // Install Backend dependencies (skip if node_modules exists and package-lock.json matches)
    log.section('Installing Backend Dependencies...');
    const beNodeModules = path.join(BE_BUILD, 'node_modules');
    const bePackageLock = path.join(BE_BUILD, 'package-lock.json');

    if (!fs.existsSync(beNodeModules) || !fs.existsSync(bePackageLock)) {
      try {
        await runCommand('npm', ['install'], BE_BUILD);
        log.success('Backend dependencies installed');
      } catch (error) {
        log.error(`Failed to install backend dependencies: ${error.message}`);
        throw error;
      }
    } else {
      log.success('Backend dependencies already installed (skipped)');
    }

    // Copy unified server to build directory
    log.section('Setting up unified server...');
    const serverSrc = path.join(__dirname, 'build-server.js');
    const serverDest = path.join(BUILD_DIR, 'server.js');
    if (fs.existsSync(serverSrc)) {
      await copyFile(serverSrc, serverDest);
      log.success('Unified server installed at build/server.js');
    }

    log.section('✨ Build Complete!');
    log.success(`Build folder created successfully!`);
    log.info(`\nDirectory structure:`);
    log.info(`  build/`);
    log.info(`  ├── server.js      ⭐ UNIFIED SERVER (starts both FE & BE!)`);
    log.info(`  ├── fe/            (Frontend - Next.js app)`);
    log.info(`  └── be/            (Backend - Express API)\n`);
    log.info(`How to run:`);
    log.info(`  node build/server.js`);
    log.info(`  or`);
    log.info(`  npm run start:prod\n`);
    log.info(`📍 Access:`);
    log.info(`   Frontend:  http://localhost:3000`);
    // log.info(`   Backend:   http://localhost:9005\n`);
    log.info(`📖 For deployment guide, see: DEPLOYMENT.md`);

  } catch (error) {
    log.error(`Build failed: ${error.message}`);
    process.exit(1);
  }
};

build();
