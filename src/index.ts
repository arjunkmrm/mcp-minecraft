#!/usr/bin/env node

import { Application } from './Application.js';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('server-jar', {
    alias: 'j',
    type: 'string',
    description: 'Path to the Minecraft server JAR file',
    default: path.join(process.cwd(), 'minecraft-server/server.jar')
  })
  .scriptName('minecraft-mcp')
  .help()
  .parseSync();

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
