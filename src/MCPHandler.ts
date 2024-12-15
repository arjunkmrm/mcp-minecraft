import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema 
} from "@modelcontextprotocol/sdk/types.js";
import { ProtocolHandler } from "./ProtocolHandler.js";
import { ReadResourceRequest, CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

export class MCPHandler {
  private server: Server;
  private protocolHandler: ProtocolHandler;

  constructor(protocolHandler: ProtocolHandler) {
    this.protocolHandler = protocolHandler;
    this.server = new Server({
      name: "minecraft-mcp-server",
      version: "1.0.0"
    }, {
      capabilities: {
        resources: {},
        tools: {}
      }
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.setupResourceHandlers();
    this.setupToolHandlers();
  }

  private setupResourceHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: "minecraft://bot/location",
          name: "Bot Location",
          mimeType: "application/json",
          description: "Current bot location in the Minecraft world"
        },
        {
          uri: "minecraft://bot/status",
          name: "Bot Status",
          mimeType: "application/json",
          description: "Current status of the bot"
        }
      ]
    }));

    // Handle resource reading
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
      switch (request.params.uri) {
        case "minecraft://bot/location": {
          const pos = this.protocolHandler.getPosition();
          if (!pos) throw new Error("Position not available");
          
          return {
            contents: [{
              uri: request.params.uri,
              mimeType: "application/json",
              text: JSON.stringify({
                x: Math.round(pos.x * 100) / 100,
                y: Math.round(pos.y * 100) / 100,
                z: Math.round(pos.z * 100) / 100
              })
            }]
          };
        }

        case "minecraft://bot/status": {
          return {
            contents: [{
              uri: request.params.uri,
              mimeType: "application/json",
              text: JSON.stringify({
                connected: this.protocolHandler.isConnected()
              })
            }]
          };
        }

        default:
          throw new Error(`Unknown resource: ${request.params.uri}`);
      }
    });
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "chat",
          description: "Send a chat message",
          inputSchema: {
            type: "object",
            properties: {
              message: { type: "string" }
            },
            required: ["message"]
          }
        },
        {
          name: "jump",
          description: "Make the bot jump",
          inputSchema: {
            type: "object",
            properties: {}
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      switch (request.params.name) {
        case "chat":
          if (request.params.arguments && request.params.arguments.message) {
            await this.protocolHandler.sendChat(request.params.arguments.message as string);
            return {
              content: [{
                type: "text",
                text: "Message sent"
              }]
            };
          } else {
            throw new Error("Invalid arguments for 'chat' tool");
          }

        case "jump":
          await this.protocolHandler.jump();
          return {
            content: [{
              type: "text",
              text: "Jumped!"
            }]
          };

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  public getServer(): Server {
    return this.server;
  }
} 