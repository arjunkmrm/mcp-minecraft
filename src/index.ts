#!/usr/bin/env node

import { Application } from './Application.js';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as fs from 'fs';

// Get the server directory from the provided JAR path
const argv = yargs(hideBin(process.argv))
  .option('server-jar', {
    alias: 'j',
    type: 'string',
    description: 'Absolute path to the Minecraft server JAR file',
    demandOption: true
  })
  .scriptName('minecraft-mcp')
  .help()
  .parseSync();

// Check if server.jar exists
if (!fs.existsSync(argv.serverJar)) {
  console.error('\nError: server.jar not found!');
  console.log('\nPlease provide the correct absolute path to your server.jar file (v1.21)');
  console.log('Download from: https://www.minecraft.net/en-us/download/server');
  process.exit(1);
}

console.log(`Using Minecraft server from: ${argv.serverJar}`);

const app = new Application({
  serverJarPath: argv.serverJar
});

// Add cleanup handler function
const cleanup = async () => {
  console.log('\nShutting down server...');
  try {
    await app.stop();
    console.log('Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown on SIGINT and SIGTERM
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Add explicit error handling for uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await cleanup();
});

process.on('unhandledRejection', async (error) => {
  console.error('Unhandled Rejection:', error);
  await cleanup();
});

app.start().catch(error => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
