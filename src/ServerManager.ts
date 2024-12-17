import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { MinecraftServerConfig } from './types/config.js';
import * as fs from 'fs';
import path from 'path';

export class ServerManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private config: MinecraftServerConfig;
  private isRunning: boolean = false;

  constructor(config: MinecraftServerConfig) {
    super();
    this.config = this.validateConfig(config);
  }

  private validateConfig(config: MinecraftServerConfig): MinecraftServerConfig {
    if (!config.serverJarPath) {
      throw new Error('Server JAR path is required');
    }
    if (!config.port || config.port < 1 || config.port > 65535) {
      throw new Error('Invalid port number');
    }
    return {
      maxPlayers: config.maxPlayers || 20,
      port: config.port,
      serverJarPath: config.serverJarPath,
      memoryAllocation: config.memoryAllocation || '2G',
      username: config.username || 'MCPBot',
      version: config.version || '1.21'
    };
  }

  private ensureEulaAccepted(): void {
    // Get the directory containing the server JAR
    const serverDir = path.dirname(this.config.serverJarPath);
    const eulaPath = path.join(serverDir, 'eula.txt');

    // Create or update eula.txt
    fs.writeFileSync(eulaPath, 'eula=true', 'utf8');
    this.emit('log', 'EULA accepted automatically');
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(this.config.serverJarPath)) {
          reject(new Error(`Server JAR not found at path: ${this.config.serverJarPath}`));
          return;
        }

        // Get the directory containing the server JAR
        const serverDir = path.dirname(this.config.serverJarPath);
        this.ensureEulaAccepted();

        this.process = spawn('java', [
          `-Xmx${this.config.memoryAllocation}`,
          `-Xms${this.config.memoryAllocation}`,
          '-jar',
          this.config.serverJarPath,
          'nogui'
        ], {
          cwd: serverDir  // Set working directory to where server.jar is
        });

        const timeout = setTimeout(() => {
          reject(new Error('Server startup timed out'));
          this.stop();
        }, 60000);

        this.process.stdout?.on('data', (data: Buffer) => {
          const message = data.toString();
          this.emit('log', message);
          
          if (message.includes('Done')) {
            clearTimeout(timeout);
            this.isRunning = true;
            resolve();
          }
        });

        this.process.stderr?.on('data', (data: Buffer) => {
          const error = data.toString();
          this.emit('error', error);
          if (error.includes('Error')) {
            reject(new Error(error));
          }
        });

        this.process.on('close', (code) => {
          this.isRunning = false;
          this.emit('stopped', code);
        });

        this.process.on('error', (err) => {
          this.isRunning = false;
          reject(err);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  public async stop(): Promise<void> {
    if (!this.isRunning || !this.process) {
      return;
    }

    return new Promise((resolve) => {
      this.process?.once('close', () => {
        this.isRunning = false;
        resolve();
      });
      
      this.process?.kill();
    });
  }

  public isServerRunning(): boolean {
    return this.isRunning;
  }
} 