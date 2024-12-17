# Minecraft MCP Integration

A Model Context Protocol (MCP) integration for Minecraft that enables AI assistants to interact with a Minecraft server. This integration allows AI models to observe and interact with the Minecraft world through a bot.

## Prerequisites

- Node.js 18 or higher
- Minecraft Java Edition Server v1.21
- Claude Desktop App

## Quick Start

1. **Download Minecraft Server**
   - Get the official Minecraft server (v1.21) from [minecraft.net/download/server](https://www.minecraft.net/en-us/download/server)
   - Save the `server.jar` file to a dedicated directory (e.g., `~/minecraft-server/`)

2. **Configure Claude Desktop**
   - Open Claude Desktop
   - Navigate to `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Add the MCP server configuration:   ```json
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
   }   ```
   > ⚠️ Replace `/absolute/path/to/minecraft-server/server.jar` with your actual server.jar path

3. **Connect to Server**
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

### Logs Location
- Server logs: Check the minecraft-server directory
- Claude Desktop logs: `~/Library/Logs/Claude/mcp*.log`

## Coming Soon
- [ ] World interaction tools
- [ ] Inventory management
- [ ] Block placement/breaking
- [ ] Entity tracking
- [ ] Advanced navigation

## Contributing

Contributions are welcome! Please check our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
