#!/usr/bin/env node

import { Application } from './Application.js';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as fs from 'fs';

// Get the current working directory where the user ran the command
const userCwd = process.cwd();
const serverDir = path.join(userCwd, 'minecraft-server');

// Create server directory if it doesn't exist
if (!fs.existsSync(serverDir)) {
  console.log('Creating minecraft-server directory...');
  fs.mkdirSync(serverDir, { recursive: true });
}

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

// Add explicit error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

app.start().catch(error => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
