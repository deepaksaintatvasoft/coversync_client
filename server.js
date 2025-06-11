#!/usr/bin/env node
import { spawn } from 'child_process';

const viteProcess = spawn('npx', ['vite', '--port', '5000', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

viteProcess.on('error', (error) => {
  console.error('Failed to start Vite:', error);
  process.exit(1);
});

viteProcess.on('close', (code) => {
  process.exit(code);
});