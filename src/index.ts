interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * CDEC (California Data Exchange Center) MCP.
 */


const DATA = 'https://cdec.water.ca.gov/dynamicapp/req/JSONDataServlet';
const META = 'https://cdec.water.ca.gov/dynamicapp/staMeta';
const RES_STORAGE = 'https://cdec.water.ca.gov/dynamicapp/req/JSONDataServlet';
const UA = 'pipeworx-mcp-cdec-ca/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  { name: 'station_info', description: 'Station metadata.', inputSchema: { type: 'object', properties: { station_id: { type: 'string' } }, required: ['station_id'] } },
  { name: 'daily_data', description: 'Daily data for (station, sensor).', inputSchema: { type: 'object', properties: { station_id: { type: 'string' }, sensor: { type: 'number' }, start: { type: 'string', description: 'YYYY-MM-DD' }, end: { type: 'string' } }, required: ['station_id', 'sensor', 'start'] } },
  { name: 'hourly_data', description: 'Hourly data.', inputSchema: { type: 'object', properties: { station_id: { type: 'string' }, sensor: { type: 'number' }, start: { type: 'string' }, end: { type: 'string' } }, required: ['station_id', 'sensor', 'start'] } },
  { name: 'event_data', description: 'Event-based irregular data.', inputSchema: { type: 'object', properties: { station_id: { type: 'string' }, sensor: { type: 'number' }, start: { type: 'string' }, end: { type: 'string' } }, required: ['station_id', 'sensor', 'start'] } },
  { name: 'latest', description: 'Latest value.', inputSchema: { type: 'object', properties: { station_id: { type: 'string' }, sensor: { type: 'number' } }, required: ['station_id', 'sensor'] } },
  { name: 'reservoirs', description: 'Reservoir storage snapshots.', inputSchema: { type: 'object', properties: { station_id: { type: 'string' } } } },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const station = (s: string | undefined) => (s ?? '').toUpperCase();
  switch (name) {
    case 'station_info':
      return cdecGet(`${META}?station_id=${encodeURIComponent(station(reqStr(args, 'station_id', '"SHA"')))}`);
    case 'daily_data':
      return seriesGet(args, 'D');
    case 'hourly_data':
      return seriesGet(args, 'H');
    case 'event_data':
      return seriesGet(args, 'E');
    case 'latest': {
      const sid = station(reqStr(args, 'station_id', '"SHA"'));
      const sensor = (args.sensor as number) | 0;
      const today = new Date().toISOString().slice(0, 10);
      const dur = 'H';
      const p = new URLSearchParams({ Stations: sid, SensorNums: String(sensor), dur_code: dur, Start: today, End: today });
      return cdecGet(`${DATA}?${p}`);
    }
    case 'reservoirs': {
      const sid = (args.station_id as string | undefined) ?? '';
      const sensor = 15; // storage
      const today = new Date().toISOString().slice(0, 10);
      const p = new URLSearchParams({ SensorNums: String(sensor), dur_code: 'D', Start: today, End: today });
      if (sid) p.set('Stations', station(sid));
      else p.set('Stations', 'SHA,ORO,FOL,DON,SLF,NML,EXC,SNL,PNF,TRM,ISB,CMN,BUL,LEC,BLB');
      return cdecGet(`${RES_STORAGE}?${p}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function seriesGet(args: Record<string, unknown>, dur: 'D' | 'H' | 'E'): Promise<unknown> {
  const p = new URLSearchParams({
    Stations: (reqStr(args, 'station_id', '"SHA"') as string).toUpperCase(),
    SensorNums: String((args.sensor as number) | 0),
    dur_code: dur,
    Start: reqStr(args, 'start', '"2026-05-01"'),
    End: String(args.end ?? new Date().toISOString().slice(0, 10)),
  });
  return cdecGet(`${DATA}?${p}`);
}

async function cdecGet(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`CDEC: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { format: 'text', body: text }; }
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
