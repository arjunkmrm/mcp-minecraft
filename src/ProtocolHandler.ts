import * as mineflayer from 'mineflayer';
import { EventEmitter } from 'events';
import { Vec3 } from 'vec3';
import pathfinderPkg from 'mineflayer-pathfinder';
const { pathfinder, Movements, goals } = pathfinderPkg;

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

        // Wait for bot to spawn before setting up pathfinder
        this.bot.once('spawn', () => {
          // Load the pathfinder plugin
          this.bot?.loadPlugin(pathfinder);
          
          // Add default movements configuration after pathfinder is loaded
          if (this.bot?.pathfinder) {
            this.bot.pathfinder.setMovements(new Movements(this.bot));
          }

          this.setupEventHandlers();
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
      const bot = this.bot;
      if (!bot) {
        resolve();
        return;
      }

      bot.once('end', () => {
        this.bot = null;
        resolve();
      });
      
      // Use end() instead of quit()
      bot.end();
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

  public async placeBlock(x: number, y: number, z: number): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    
    try {
      const targetPos = new Vec3(x, y, z);
      const faceVector = new Vec3(0, 1, 0); // Default to top face
      
      // Get the block we're trying to place against
      const referenceBlock = await this.bot.blockAt(targetPos);
      if (!referenceBlock) throw new Error('No reference block found');
      
      await this.bot.placeBlock(referenceBlock, faceVector);
    } catch (error) {
      throw new Error(`Failed to place block: ${error}`);
    }
  }

  public async digBlock(x: number, y: number, z: number): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    
    try {
      const targetPos = new Vec3(x, y, z);
      const block = await this.bot.blockAt(targetPos);
      
      if (!block) throw new Error('No block at target position');
      if (block.name === 'air') throw new Error('Cannot dig air');
      
      await this.bot.dig(block);
    } catch (error) {
      throw new Error(`Failed to dig block: ${error}`);
    }
  }

  public async getBlockInfo(x: number, y: number, z: number): Promise<any> {
    if (!this.bot) throw new Error('Bot not connected');
    
    try {
      const targetPos = new Vec3(x, y, z);
      const block = await this.bot.blockAt(targetPos);
      
      if (!block) throw new Error('No block at target position');
      
      return {
        name: block.name,
        type: block.type,
        position: {
          x: block.position.x,
          y: block.position.y,
          z: block.position.z
        },
        hardness: block.hardness
      };
    } catch (error) {
      throw new Error(`Failed to get block info: ${error}`);
    }
  }

  public async selectSlot(slot: number): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    if (slot < 0 || slot > 8) throw new Error('Slot must be between 0 and 8');
    
    try {
      await this.bot.setQuickBarSlot(slot);
    } catch (error) {
      throw new Error(`Failed to select slot: ${error}`);
    }
  }

  public async getInventory(): Promise<any> {
    if (!this.bot) throw new Error('Bot not connected');
    
    const items = this.bot.inventory.items();
    return items.map(item => ({
      name: item.name,
      count: item.count,
      slot: item.slot,
      displayName: item.displayName
    }));
  }

  public async equipItem(itemName: string, destination?: string): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    
    try {
        const item = this.bot.inventory.items().find(item => item.name.includes(itemName));
        if (!item) throw new Error(`Item ${itemName} not found in inventory`);
        
        const equipDestination: mineflayer.EquipmentDestination | null = destination as mineflayer.EquipmentDestination || null;
        await this.bot.equip(item, equipDestination);
    } catch (error) {
        throw new Error(`Failed to equip item: ${error}`);
    }
  }

  public async getStatus(): Promise<any> {
    if (!this.bot) throw new Error('Bot not connected');
    
    return {
        health: this.bot.health,
        food: this.bot.food,
        gameMode: this.bot.game?.gameMode ?? 'unknown',
        position: this.getPosition(),
        isRaining: this.bot.isRaining,
        time: {
            timeOfDay: this.bot.time?.timeOfDay ?? 0,
            day: this.bot.time?.day ?? 0
        }
    };
  }

  public async getNearbyEntities(range: number = 10): Promise<any[]> {
    if (!this.bot) throw new Error('Bot not connected');
    
    return Object.values(this.bot.entities)
        .filter(entity => {
            if (!entity.position || !this.bot?.entity?.position) return false;
            return entity.position.distanceTo(this.bot.entity.position) <= range;
        })
        .map(entity => ({
            name: entity.name,
            type: entity.type,
            position: entity.position,
            distance: entity.position && this.bot?.entity?.position 
                ? entity.position.distanceTo(this.bot.entity.position) 
                : null // Handle the case where position might be null
        }));
  }

  public async attack(entityName: string): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    
    try {
      const entity = Object.values(this.bot.entities)
        .find(e => e.name === entityName && 
          e.position.distanceTo(this.bot!.entity.position) <= 4);
      
      if (!entity) throw new Error('Entity not found or too far');
      await this.bot.attack(entity);
    } catch (error) {
      throw new Error(`Failed to attack: ${error}`);
    }
  }

  public async useItem(hand: 'right' | 'left' = 'right'): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    
    try {
      await this.bot.activateItem(hand === 'right');
    } catch (error) {
      throw new Error(`Failed to use item: ${error}`);
    }
  }

  public async stopUsingItem(): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    
    try {
      await this.bot.deactivateItem();
    } catch (error) {
      throw new Error(`Failed to stop using item: ${error}`);
    }
  }

  public async lookAt(x: number, y: number, z: number): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    
    try {
      await this.bot.lookAt(new Vec3(x, y, z));
    } catch (error) {
      throw new Error(`Failed to look at position: ${error}`);
    }
  }

  public async followPlayer(playerName: string): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    
    try {
        const player = this.bot.players[playerName]?.entity;
        if (!player) throw new Error('Player not found');

        // Follow at 2 blocks distance
        await this.bot.pathfinder.goto(
            new goals.GoalFollow(player, 2)
        );
    } catch (error) {
        throw new Error(`Failed to follow player: ${error}`);
    }
  }

  public async stopFollowing(): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    this.bot.pathfinder.stop();
  }

  public async goToPosition(x: number, y: number, z: number): Promise<void> {
    if (!this.bot) throw new Error('Bot not connected');
    
    try {
        await this.bot.pathfinder.goto(
            new goals.GoalBlock(x, y, z)
        );
    } catch (error) {
        throw new Error(`Failed to go to position: ${error}`);
    }
  }
} 