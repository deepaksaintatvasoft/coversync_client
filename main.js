// Simple entry point to start the frontend application
import { exec } from 'child_process';

// Start vite dev server
exec('npx vite', { stdio: 'inherit' }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log(stdout);
  if (stderr) {
    console.error(stderr);
  }
});