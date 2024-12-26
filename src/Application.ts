import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ServerManager } from "./ServerManager.js";
import { ProtocolHandler } from "./ProtocolHandler.js";
import { MCPHandler } from "./MCPHandler.js";
import path from 'path';
import { createLogger } from './logger.js'

interface ApplicationConfig {
  serverJarPath: string;
}

export class Application {
  private serverManager: ServerManager;
  private protocolHandler: ProtocolHandler;
  private mcpHandler: MCPHandler;
  private transport: StdioServerTransport | null = null;
  private logger = createLogger('Application');

  constructor(config: ApplicationConfig) {
    const serverPath = path.resolve(config.serverJarPath);
    
    // Initialize with config from CLI
    this.serverManager = new ServerManager({
      maxPlayers: 10,
      port: 25565,
      serverJarPath: serverPath,
      memoryAllocation: '2G',
      username: 'MCPBot',
      version: '1.21'
    });

    this.protocolHandler = new ProtocolHandler({
      host: 'localhost',
      port: 25565,
      username: 'MCPBot',
      version: '1.21'
    });

    this.mcpHandler = new MCPHandler(this.protocolHandler);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.serverManager.on('log', (message) => {
      this.logger.info(`[Server] ${message}`);
    });

    this.serverManager.on('error', (error) => {
      this.logger.error(`[Server Error] ${error}`);
    });

    this.protocolHandler.on('chat', ({ username, message }) => {
      this.logger.info(`[Chat] ${username}: ${message}`);
    });

    this.protocolHandler.on('error', (error) => {
      this.logger.error(`[Bot Error] ${error}`);
    });

    process.on('SIGINT', async () => {
      this.logger.info('Shutting down...');
      await this.shutdown();
      process.exit(0);
    });
  }

  public async start(): Promise<void> {
    try {
      // Start MCP server first - use only stdout for MCP communication
      this.transport = new StdioServerTransport();
      await this.mcpHandler.getServer().connect(this.transport);
      this.logger.info('MCP server ready');

      // Start Minecraft server
      await this.serverManager.start();
      this.logger.info('Minecraft server started successfully');

      // Wait a bit for the server to initialize
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Connect bot
      await this.protocolHandler.connect();
      this.logger.info('Bot connected successfully');

    } catch (error) {
      this.logger.error(`Failed to start: ${error}`);
      await this.shutdown();
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Initiating shutdown sequence...');
    
    // Add MCP server shutdown
    if (this.mcpHandler && this.transport) {
      this.logger.info('Stopping MCP server...');
      // Assuming no disconnect method, handle cleanup here if needed
      this.transport = null;
    }
    
    this.logger.info('Disconnecting bot...');
    await this.protocolHandler.disconnect();

    this.logger.info('Stopping Minecraft server...');
    await this.serverManager.stop();
  }

  async stop(): Promise<void> {
    try {
      // Disconnect MCP server
      if (this.mcpHandler && this.transport) {
        this.logger.info('Stopping MCP server...');
        await this.mcpHandler.getServer().close();
        this.transport = null;
      }

      // Disconnect bot
      this.logger.info('Disconnecting bot...');
      await this.protocolHandler.disconnect();

      // Stop Minecraft server
      this.logger.info('Stopping Minecraft server...');
      await this.serverManager.stop();

      this.logger.info('Cleanup complete');
    } catch (error) {
      this.logger.error(`Error during cleanup: ${error}`);
      throw error;
    }
  }
} 