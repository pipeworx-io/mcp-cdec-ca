# @pipeworx/cdec-ca

California Data Exchange Center ([CDEC](https://cdec.water.ca.gov)) MCP — California Department of Water Resources real-time and historical hydrology, reservoir storage, snow water content, and stream gauges. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `station_info(station_id)` — station metadata
- `daily_data(station_id, sensor, start, end?)` — daily SHEF data
- `hourly_data(station_id, sensor, start, end?)` — hourly SHEF data
- `event_data(station_id, sensor, start, end?)` — event-based (irregular)
- `latest(station_id, sensor)` — latest value
- `reservoirs(station_id?)` — reservoir storage snapshots (statewide or one)

`sensor` is a CDEC sensor number (e.g. 15 = reservoir storage, 8 = full-natural flow, 76 = stream stage, 3 = SWE).

## Data source

`https://cdec.water.ca.gov/dynamicapp/req/JSONDataServlet` + `dynamicapp/staMeta`.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "cdec-ca": {
      "url": "https://gateway.pipeworx.io/cdec-ca/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Cdec Ca data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
