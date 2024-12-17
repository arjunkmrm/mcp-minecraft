import * as mineflayer from 'mineflayer';
import { EventEmitter } from 'events';
import { Vec3 } from 'vec3';

export interface BotConfig {
  host: string;
  port: number;
  username: string;
  version: string;
}

export class ProtocolHandler extends EventEmitter {
  private bot: mineflayer.Bot | null = null;
  private config: BotConfig;

  constructor(config: BotConfig) {
    super();
    this.config = config;
  }

  public async connect(): Promise<void> {
    if (this.bot) {
      throw new Error('Bot is already connected');
    }

    console.log('Connecting with version:', this.config.version);

    return new Promise((resolve, reject) => {
      try {
        this.bot = mineflayer.createBot({
          host: this.config.host,
          port: this.config.port,
          username: this.config.username,
          version: this.config.version
        });

        this.setupEventHandlers();

        this.bot.once('spawn', () => {
          this.emit('connected');
          resolve();
        });

        this.bot.on('error', (error) => {
          this.emit('error', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.bot) return;

    this.bot.on('chat', (username, message) => {
      this.emit('chat', { username, message });
    });

    this.bot.on('kicked', (reason) => {
      this.emit('kicked', reason);
    });

    this.bot.on('error', (error) => {
      this.emit('error', error);
    });
  }

  // Bot actions
  public async sendChat(message: string): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    await this.bot.chat(message);
  }

  public async jump(): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    this.bot.setControlState('jump', true);
    setTimeout(() => {
      if (this.bot) this.bot.setControlState('jump', false);
    }, 500);
  }

  public getPosition(): Vec3 | null {
    if (!this.bot || !this.bot.entity) return null;
    return this.bot.entity.position;
  }

  public async disconnect(): Promise<void> {
    if (!this.bot) return;
    
    return new Promise((resolve) => {
      this.bot?.once('end', () => {
        this.bot = null;
        resolve();
      });
      
      this.bot?.quit();
    });
  }

  public isConnected(): boolean {
    return this.bot !== null;
  }

  public async moveForward(): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    this.bot.setControlState('forward', true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.bot.setControlState('forward', false);
  }

  public async moveBack(): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    this.bot.setControlState('back', true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.bot.setControlState('back', false);
  }

  public async turnLeft(): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    this.bot.setControlState('left', true);
    await new Promise(resolve => setTimeout(resolve, 500));
    this.bot.setControlState('left', false);
  }

  public async turnRight(): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    this.bot.setControlState('right', true);
    await new Promise(resolve => setTimeout(resolve, 500));
    this.bot.setControlState('right', false);
  }
} 