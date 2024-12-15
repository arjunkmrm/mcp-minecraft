import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ServerManager } from "./ServerManager.js";
import { ProtocolHandler } from "./ProtocolHandler.js";
import { MCPHandler } from "./MCPHandler.js";
import path from 'path';

export class Application {
  private serverManager: ServerManager;
  private protocolHandler: ProtocolHandler;
  private mcpHandler: MCPHandler;

  constructor() {
    // Initialize with default config
    this.serverManager = new ServerManager({
      maxPlayers: 10,
      port: 25565,
      serverJarPath: path.join(process.cwd(), 'minecraft-server/server.jar'),
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
      console.log('[Server]', message);
    });

    this.serverManager.on('error', (error) => {
      console.error('[Server Error]', error);
    });

    this.protocolHandler.on('chat', ({ username, message }) => {
      console.log('[Chat]', `${username}: ${message}`);
    });

    this.protocolHandler.on('error', (error) => {
      console.error('[Bot Error]', error);
    });

    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await this.shutdown();
      process.exit(0);
    });
  }

  public async start(): Promise<void> {
    try {
      // Start Minecraft server
      console.log('Starting Minecraft server...');
      await this.serverManager.start();
      console.log('Minecraft server started successfully');

      // Wait a bit for the server to initialize
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Connect bot
      console.log('Connecting bot to server...');
      await this.protocolHandler.connect();
      console.log('Bot connected successfully');

      // Start MCP server
      console.log('Starting MCP server...');
      const transport = new StdioServerTransport();
      await this.mcpHandler.getServer().connect(transport);
      console.log('MCP server ready');

    } catch (error) {
      console.error('Failed to start:', error);
      await this.shutdown();
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    console.log('Disconnecting bot...');
    await this.protocolHandler.disconnect();

    console.log('Stopping Minecraft server...');
    await this.serverManager.stop();
  }
} 