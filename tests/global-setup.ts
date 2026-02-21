import { spawn, ChildProcess } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

let devServer: ChildProcess | null = null;

/**
 * Global setup - starts Next.js dev server for API tests
 */
export async function setup() {
  // Skip in CI or if server is already running
  if (process.env.CI || process.env.SKIP_DEV_SERVER) {
    console.log('⏭️  Skipping dev server startup (CI or SKIP_DEV_SERVER set)');
    return;
  }

  // Check if server is already running
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Dev server already running, skipping startup');
      return;
    }
  } catch {
    // Server not running, start it
  }

  console.log('🚀 Starting Next.js dev server for tests...');

  return new Promise<void>((resolve, reject) => {
    devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env },
    });

    let serverReady = false;
    const timeout = setTimeout(() => {
      if (!serverReady) {
        console.error('❌ Dev server failed to start within 60s');
        devServer?.kill();
        reject(new Error('Dev server startup timeout'));
      }
    }, 60000);

    devServer.stdout?.on('data', (data) => {
      const output = data.toString();
      // Look for Next.js ready indicators
      if (
        output.includes('Ready in') ||
        output.includes('Local:') ||
        output.includes('started server on')
      ) {
        if (!serverReady) {
          serverReady = true;
          clearTimeout(timeout);
          console.log('✅ Dev server ready');
          resolve();
        }
      }
    });

    devServer.stderr?.on('data', (data) => {
      const output = data.toString();
      // Only log actual errors, not warnings
      if (output.includes('Error:') && !output.includes('Warning:')) {
        console.error('Dev server error:', output);
      }
    });

    devServer.on('error', (error) => {
      clearTimeout(timeout);
      console.error('❌ Failed to start dev server:', error);
      reject(error);
    });

    devServer.on('exit', (code) => {
      if (code !== 0 && !serverReady) {
        clearTimeout(timeout);
        reject(new Error(`Dev server exited with code ${code}`));
      }
    });
  });
}

/**
 * Global teardown - stops Next.js dev server
 */
export async function teardown() {
  if (devServer) {
    console.log('🛑 Stopping dev server...');
    devServer.kill();
    devServer = null;
  }
}
