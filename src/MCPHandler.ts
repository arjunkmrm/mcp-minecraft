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
        },
        {
          name: "moveForward",
          description: "Make the bot move forward",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "moveBack",
          description: "Make the bot move backward",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "turnLeft",
          description: "Make the bot turn left",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "turnRight",
          description: "Make the bot turn right",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "placeBlock",
          description: "Place a block at specified coordinates",
          inputSchema: {
            type: "object",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              z: { type: "number" }
            },
            required: ["x", "y", "z"]
          }
        },
        {
          name: "digBlock",
          description: "Break a block at specified coordinates",
          inputSchema: {
            type: "object",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              z: { type: "number" }
            },
            required: ["x", "y", "z"]
          }
        },
        {
          name: "getBlockInfo",
          description: "Get information about a block at specified coordinates",
          inputSchema: {
            type: "object",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              z: { type: "number" }
            },
            required: ["x", "y", "z"]
          }
        },
        {
          name: "selectSlot",
          description: "Select a hotbar slot (0-8)",
          inputSchema: {
            type: "object",
            properties: {
              slot: { 
                type: "number",
                minimum: 0,
                maximum: 8
              }
            },
            required: ["slot"]
          }
        },
        {
          name: "getInventory",
          description: "Get contents of bot's inventory",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "equipItem",
          description: "Equip an item by name",
          inputSchema: {
            type: "object",
            properties: {
              itemName: { type: "string" },
              destination: { 
                type: "string",
                enum: ["hand", "head", "torso", "legs", "feet"]
              }
            },
            required: ["itemName"]
          }
        },
        {
          name: "getStatus",
          description: "Get bot's current status including health, food, position, etc.",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "getNearbyEntities",
          description: "Get list of nearby entities within specified range",
          inputSchema: {
            type: "object",
            properties: {
              range: {
                type: "number",
                minimum: 1,
                maximum: 100,
                default: 10
              }
            }
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

        case "moveForward":
          await this.protocolHandler.moveForward();
          return {
            content: [{ type: "text", text: "Moved forward" }]
          };

        case "moveBack":
          await this.protocolHandler.moveBack();
          return {
            content: [{ type: "text", text: "Moved backward" }]
          };

        case "turnLeft":
          await this.protocolHandler.turnLeft();
          return {
            content: [{ type: "text", text: "Turned left" }]
          };

        case "turnRight":
          await this.protocolHandler.turnRight();
          return {
            content: [{ type: "text", text: "Turned right" }]
          };

        case "placeBlock": {
          const { x, y, z } = request.params.arguments as { x: number, y: number, z: number };
          await this.protocolHandler.placeBlock(x, y, z);
          return {
            content: [{ type: "text", text: `Placed block at (${x}, ${y}, ${z})` }]
          };
        }

        case "digBlock": {
          const { x, y, z } = request.params.arguments as { x: number, y: number, z: number };
          await this.protocolHandler.digBlock(x, y, z);
          return {
            content: [{ type: "text", text: `Broke block at (${x}, ${y}, ${z})` }]
          };
        }

        case "getBlockInfo": {
          const { x, y, z } = request.params.arguments as { x: number, y: number, z: number };
          const blockInfo = await this.protocolHandler.getBlockInfo(x, y, z);
          return {
            content: [{ type: "text", text: JSON.stringify(blockInfo, null, 2) }]
          };
        }

        case "selectSlot": {
          const { slot } = request.params.arguments as { slot: number };
          await this.protocolHandler.selectSlot(slot);
          return {
            content: [{ type: "text", text: `Selected slot ${slot}` }]
          };
        }

        case "getInventory": {
          const inventory = await this.protocolHandler.getInventory();
          return {
            content: [{ type: "text", text: JSON.stringify(inventory, null, 2) }]
          };
        }

        case "equipItem": {
          const { itemName, destination } = request.params.arguments as { 
            itemName: string, 
            destination?: string 
          };
          await this.protocolHandler.equipItem(itemName, destination);
          return {
            content: [{ 
              type: "text", 
              text: `Equipped ${itemName}${destination ? ` to ${destination}` : ''}`
            }]
          };
        }

        case "getStatus": {
          const status = await this.protocolHandler.getStatus();
          return {
            content: [{ type: "text", text: JSON.stringify(status, null, 2) }]
          };
        }

        case "getNearbyEntities": {
          const { range } = request.params.arguments as { range?: number };
          const entities = await this.protocolHandler.getNearbyEntities(range);
          return {
            content: [{ type: "text", text: JSON.stringify(entities, null, 2) }]
          };
        }

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  public getServer(): Server {
    return this.server;
  }
} 