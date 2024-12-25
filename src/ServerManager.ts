import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { MinecraftServerConfig } from './types/config.js';
import * as fs from 'fs';
import path from 'path';
import * as os from 'os';

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
  }

  private ensureServerProperties(): void {
    const serverDir = path.dirname(this.config.serverJarPath);
    const propsPath = path.join(serverDir, 'server.properties');

    let properties = '';
    if (fs.existsSync(propsPath)) {
      properties = fs.readFileSync(propsPath, 'utf8');
    }

    // Define our server properties for a simple plains world
    const serverProperties = {
      'online-mode': 'false',
      'level-type': 'flat',
      'spawn-protection': '0',
      'difficulty': 'peaceful',          // No hostile mobs
      'spawn-monsters': 'false',         // Disable monster spawning
      'spawn-animals': 'true',           // Enable animal spawning
      'spawn-npcs': 'false',             // Disable villagers
      'generate-structures': 'false',     // Disable structures (villages, temples, etc)
      'allow-nether': 'false',           // Disable nether
      'gamemode': 'creative',            // Set creative mode for easier building
      'do-daylight-cycle': 'false',
      'max-players': this.config.maxPlayers.toString(),
      'server-port': this.config.port.toString(),
      'motd': 'Peaceful Plains Server'
    };

    // Update or create each property
    for (const [key, value] of Object.entries(serverProperties)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (properties.match(regex)) {
        properties = properties.replace(regex, `${key}=${value}`);
      } else {
        properties += `\n${key}=${value}`;
      }
    }

    fs.writeFileSync(propsPath, properties.trim(), 'utf8');
  }

  private normalizePath(p: string): string {
    return path.normalize(p).toLowerCase();
  }

  private expandHome(filepath: string): string {
    if (filepath.startsWith("~/") || filepath === "~") {
      return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
  }

  private validateServerPath(): string {
    const expandedPath = this.expandHome(this.config.serverJarPath);
    const absolutePath = path.isAbsolute(expandedPath) 
      ? path.resolve(expandedPath)
      : path.resolve(process.cwd(), expandedPath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Server JAR not found at path: ${absolutePath}`);
    }
    
    return absolutePath;
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        const serverJarPath = this.validateServerPath();
        const serverDir = path.dirname(serverJarPath);
        
        this.ensureEulaAccepted();
        this.ensureServerProperties();

        // Use absolute paths and set proper working directory
        this.process = spawn('java', [
          `-Xmx${this.config.memoryAllocation}`,
          `-Xms${this.config.memoryAllocation}`,
          '-jar',
          serverJarPath,
          'nogui'
        ], {
          cwd: serverDir,
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: false // Ensure process is attached to parent
        });

        const timeout = setTimeout(() => {
          reject(new Error('Server startup timed out'));
          this.stop();
        }, 60000);

        this.process.stdout?.on('data', (data: Buffer) => {
          const message = data.toString();
          
          if (message.includes('Done')) {
            clearTimeout(timeout);
            this.isRunning = true;
            resolve();
          }
        });

        this.process.stderr?.on('data', (data: Buffer) => {
          const error = data.toString();
          if (error.includes('Error')) {
            reject(new Error(error));
          }
        });

        this.process.on('close', (code) => {
          this.isRunning = false;
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