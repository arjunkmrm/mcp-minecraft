#!/usr/bin/env node

import { Application } from './Application.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as fs from 'fs';

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

if (!fs.existsSync(argv.serverJar)) {
  process.exit(1);
}

const app = new Application({
  serverJarPath: argv.serverJar
});

const cleanup = async () => {
  try {
    await app.stop();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

process.on('uncaughtException', async (error) => {
  await cleanup();
});

process.on('unhandledRejection', async (error) => {
  await cleanup();
});

app.start().catch(() => {
  process.exit(1);
});
