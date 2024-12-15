import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { MinecraftServerConfig } from './types/config.js';

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

  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        this.process = spawn('java', [
          `-Xmx${this.config.memoryAllocation}`,
          `-Xms${this.config.memoryAllocation}`,
          '-jar',
          this.config.serverJarPath,
          'nogui'
        ]);

        this.process.stdout?.on('data', (data: Buffer) => {
          const message = data.toString();
          this.emit('log', message);
          
          if (message.includes('Done')) {
            this.isRunning = true;
            resolve();
          }
        });

        this.process.stderr?.on('data', (data: Buffer) => {
          this.emit('error', data.toString());
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