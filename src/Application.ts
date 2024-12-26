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
      process.stderr.write(`[Server] ${message}\n`);
    });

    this.serverManager.on('error', (error) => {
      process.stderr.write(`[Server Error] ${error}\n`);
    });

    this.protocolHandler.on('chat', ({ username, message }) => {
      process.stderr.write(`[Chat] ${username}: ${message}\n`);
    });

    this.protocolHandler.on('error', (error) => {
      process.stderr.write(`[Bot Error] ${error}\n`);
    });

    process.on('SIGINT', async () => {
      process.stderr.write('\nShutting down...\n');
      await this.shutdown();
      process.exit(0);
    });
  }

  public async start(): Promise<void> {
    try {
      // Start MCP server first
      console.log('Starting MCP server...');
      this.transport = new StdioServerTransport();
      await this.mcpHandler.getServer().connect(this.transport);
      console.log('MCP server ready');

      // Start Minecraft server
      process.stderr.write('Starting Minecraft server...\n');
      await this.serverManager.start();
      process.stderr.write('Minecraft server started successfully\n');

      // Wait a bit for the server to initialize
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Connect bot
      process.stderr.write('Connecting bot to server...\n');
      await this.protocolHandler.connect();
      process.stderr.write('Bot connected successfully\n');

    } catch (error) {
      process.stderr.write(`Failed to start: ${error}\n`);
      await this.shutdown();
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    process.stderr.write('Shutting down...\n');
    
    // Add MCP server shutdown
    if (this.mcpHandler && this.transport) {
      process.stderr.write('Stopping MCP server...\n');
      // Assuming no disconnect method, handle cleanup here if needed
      this.transport = null;
    }
    
    process.stderr.write('Disconnecting bot...\n');
    await this.protocolHandler.disconnect();

    process.stderr.write('Stopping Minecraft server...\n');
    await this.serverManager.stop();
  }

  async stop(): Promise<void> {
    try {
      // Disconnect MCP server
      if (this.mcpHandler && this.transport) {
        process.stderr.write('Stopping MCP server...\n');
        await this.mcpHandler.getServer().close();
        this.transport = null;
      }

      // Disconnect bot
      process.stderr.write('Disconnecting bot...\n');
      await this.protocolHandler.disconnect();

      // Stop Minecraft server
      process.stderr.write('Stopping Minecraft server...\n');
      await this.serverManager.stop();

      process.stderr.write('Cleanup complete\n');
    } catch (error) {
      process.stderr.write(`Error during cleanup: ${error}\n`);
      throw error;
    }
  }
} 