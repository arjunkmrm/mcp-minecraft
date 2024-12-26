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
    });

    this.serverManager.on('error', (error) => {
    });

    this.protocolHandler.on('chat', ({ username, message }) => {
    });

    this.protocolHandler.on('error', (error) => {
    });

    process.on('SIGINT', async () => {
      await this.shutdown();
      process.exit(0);
    });
  }

  public async start(): Promise<void> {
    try {
      // Start MCP server first - use only stdout for MCP communication
      this.transport = new StdioServerTransport();
      await this.mcpHandler.getServer().connect(this.transport);

      // Start Minecraft server
      await this.serverManager.start();

      // Wait a bit for the server to initialize
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Connect bot
      await this.protocolHandler.connect();

    } catch (error) {
      await this.shutdown();
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    if (this.mcpHandler && this.transport) {
      this.transport = null;
    }
    
    await this.protocolHandler.disconnect();
    await this.serverManager.stop();
  }

  async stop(): Promise<void> {
    try {
      // Disconnect MCP server
      if (this.mcpHandler && this.transport) {
        await this.mcpHandler.getServer().close();
        this.transport = null;
      }

      // Disconnect bot
      await this.protocolHandler.disconnect();

      // Stop Minecraft server
      await this.serverManager.stop();

    } catch (error) {
      throw error;
    }
  }
} 