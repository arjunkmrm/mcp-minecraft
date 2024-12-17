import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ServerManager } from "./ServerManager.js";
import { ProtocolHandler } from "./ProtocolHandler.js";
import { MCPHandler } from "./MCPHandler.js";
import path from 'path';

interface ApplicationConfig {
  serverJarPath: string;
}

export class Application {
  private serverManager: ServerManager;
  private protocolHandler: ProtocolHandler;
  private mcpHandler: MCPHandler;
  private transport: StdioServerTransport | null = null;

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
      this.transport = new StdioServerTransport();
      await this.mcpHandler.getServer().connect(this.transport);
      console.log('MCP server ready');

    } catch (error) {
      console.error('Failed to start:', error);
      await this.shutdown();
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down...');
    
    // Add MCP server shutdown
    if (this.mcpHandler && this.transport) {
      console.log('Stopping MCP server...');
      // Assuming no disconnect method, handle cleanup here if needed
      this.transport = null;
    }
    
    console.log('Disconnecting bot...');
    await this.protocolHandler.disconnect();

    console.log('Stopping Minecraft server...');
    await this.serverManager.stop();
  }
} 