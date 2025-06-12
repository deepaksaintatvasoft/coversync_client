#!/usr/bin/env node
import { exec } from 'child_process';

// Start Vite development server directly
const viteProcess = exec('npx vite --host 0.0.0.0 --port 5173', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log(stdout);
  if (stderr) {
    console.error(stderr);
  }
});

viteProcess.stdout.on('data', (data) => {
  console.log(data);
});

viteProcess.stderr.on('data', (data) => {
  console.error(data);
});

process.on('SIGINT', () => {
  viteProcess.kill();
  process.exit();
});