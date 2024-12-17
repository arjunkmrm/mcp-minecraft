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
    description: 'Path to the Minecraft server JAR file',
    default: path.join(serverDir, 'server.jar')
  })
  .scriptName('minecraft-mcp')
  .help()
  .parseSync();

// Check if server.jar exists
if (!fs.existsSync(argv.serverJar)) {
  console.error('\nError: server.jar not found!');
  console.log('\nPlease download the Minecraft server.jar (v1.21) from:');
  console.log('https://www.minecraft.net/en-us/download/server');
  console.log(`\nAnd place it at: ${argv.serverJar}`);
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
