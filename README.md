# Minecraft MCP Integration

A Model Context Protocol (MCP) integration for Minecraft that enables AI assistants to interact with a Minecraft server. This integration allows AI models to observe and interact with the Minecraft world through a bot.

![Screenshot](/public/screenshot.png?quality=medium)

## Prerequisites

1. Minecraft Java Edition v1.21
2. Node.js 18 or higher
3. Claude Desktop App

> ⚠️ Note: Currently only tested on macOS/Linux. Windows compatibility is not guaranteed.

## Important Note

1. Use the F3+P Shortcut (Java Edition):
If you're playing Java Edition on PC, press F3 + P together. This toggles the "Pause on Lost Focus" feature. Once turned off, you can switch to another claude desktop and Minecraft will continue running without pausing.

![Focus Settings](/public/focus.png)

## Installation Steps

1. **Download and Setup Minecraft Server**
   - Download Minecraft server v1.21 from [mcversions.net/1.21](https://mcversions.net/download/1.21)
   - Create a dedicated directory (e.g., `~/minecraft-server/`)
   - Place the downloaded `server.jar` file in this directory
   - Note down the absolute path to your `server.jar` file

2. **Install and Configure MCP Integration**
   
   Quick Install (Recommended):
   ```bash
   npx -y @smithery/cli install mcp-minecraft --client claude
   ```
   Follow the CLI prompts to complete the setup.

   Or Manual Setup:
   - Navigate to `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Add the MCP server configuration:   
   ```json
   {
     "mcpServers": {
       "mcp-minecraft": {
         "command": "npx",
         "args": [
           "-y",
           "mcp-minecraft@latest",
           "--server-jar",
           "/absolute/path/to/minecraft-server/server.jar"
         ]
       }
     }
   }   
   ```
   > ⚠️ Replace `/absolute/path/to/minecraft-server/server.jar` with your actual server.jar path

4. **Launch Claude Desktop**
   - Start Claude Desktop after completing the configuration

5. **Connect to Server**
   - Launch Minecraft Java Edition
   - Select "Multiplayer"
   - Click "Add Server"
   - Enter server details:
     - Server Name: `Minecraft Server`
     - Server Address: `localhost:25565`
   - Click "Done"

## Features

### Resources
The integration exposes these MCP resources:

- `minecraft://bot/location` - Current bot position in the world
- `minecraft://bot/status` - Bot connection status

### Tools
Available MCP tools:

- `chat` - Send chat messages to the server
- `jump` - Make the bot jump
- `moveForward` - Make the bot move forward
- `moveBack` - Make the bot move backward
- `turnLeft` - Make the bot turn left
- `turnRight` - Make the bot turn right
- `placeBlock` - Place a block at specified coordinates
- `digBlock` - Break a block at specified coordinates
- `getBlockInfo` - Get information about a block at specified coordinates
- `selectSlot` - Select a hotbar slot (0-8)
- `getInventory` - Get contents of bot's inventory
- `equipItem` - Equip an item by name to specified destination
- `getStatus` - Get bot's current status (health, food, position, etc.)
- `getNearbyEntities` - Get list of nearby entities within range
- `attack` - Attack a nearby entity by name
- `useItem` - Use/activate the currently held item
- `stopUsingItem` - Stop using/deactivate the current item
- `lookAt` - Make the bot look at specific coordinates
- `followPlayer` - Follow a specific player
- `stopFollowing` - Stop following current target
- `goToPosition` - Navigate to specific coordinates

## Technical Details

- Server runs in offline mode for local development
- Default memory allocation: 2GB
- Default port: 25565
- Bot username: MCPBot

## Troubleshooting

### Common Issues

1. **Server Won't Start**
   - Verify Java is installed
   - Check server.jar path is correct
   - Ensure port 25565 is available

2. **Can't Connect to Server**
   - Verify server is running (check logs)
   - Confirm you're using "localhost" as server address
   - Check firewall settings

3. **MCP Connection Failed**
   - Restart Claude Desktop
   - Verify config.json syntax
   - Check server.jar path is absolute

4. **Java Process Persists After Closing**
   - If you experience issues reconnecting after closing Claude, check for lingering Java processes
   - You may need to manually terminate the Java process:
     - Windows: Use Task Manager (untested)
     - Mac/Linux: Use `ps aux | grep java` and `kill <PID>`
   - If process termination doesn't work, restart your computer
   - This issue should auto-resolve in most cases with the latest version

### Logs Location
- Server logs: Check the minecraft-server directory
- Claude Desktop logs: `~/Library/Logs/Claude/mcp*.log`

## Contributing

Contributions, big or small, are welcome!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
