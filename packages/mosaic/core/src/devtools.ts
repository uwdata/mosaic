import { EventClient } from '@tanstack/devtools-event-client';
import { TanStackDevtoolsCore } from '@tanstack/devtools'

type QueryEventTypes = {
  'queries:start': {
    query: string;
    materialized: boolean;
    clientId: string;
    timestamp: number;
  };
  'queries:end': {
    query: string;
    materialized: boolean;
    clientId?: string;
    latencyMs?: number;
    numRows?: number;
    numBytes?: number;
    exemplarRows?: Record<string, unknown>[]; // first ~10 rows
    timestamp: number;
  };
};

type ClientState = {
  clientId: string;
  connected: boolean;
  lastQuery?: string;
  lastLatencyMs?: number;
  lastNumRows?: number;
  lastNumBytes?: number;
  lastExemplarRows?: Record<string, unknown>[];
  children?: ClientState[]; // for tree structure
};

type ClientEventTypes = {
  'clients:state': {
    clients: ClientState[];
    coordinatorState: Record<string, unknown>;
    numConnectedClients: number;
    timestamp: number;
  };
};

// Module-level singletons for the event clients
let _queryEventClient: EventClient<QueryEventTypes> | null = null;
let _clientEventClient: EventClient<ClientEventTypes> | null = null;

/**
 * Return (and lazily create) the shared event clients that the rest of the
 * codebase (Coordinator / QueryManager) and the devtools UI will all use.
 */
export function createEventClients() {
  if (!_queryEventClient || !_clientEventClient) {
    _queryEventClient = new EventClient<QueryEventTypes>({ pluginId: 'queries', debug: true });
    _clientEventClient = new EventClient<ClientEventTypes>({ pluginId: 'clients', debug: true });
  }
  return { queryEventClient: _queryEventClient, clientEventClient: _clientEventClient };
}

/**
 * Initialize a very small devtools UI and hook it up to the shared EventClients.
 * The plugin will append nodes into the element you mount it into and update
 * when events arrive.
 */
 export function initializeDevtools(document: Document) {
   // avoid adding multiple devtools containers
   let devtoolsDiv = document.getElementById('devtools');
   if (!devtoolsDiv) {
     devtoolsDiv = document.createElement('div');
     devtoolsDiv.id = 'devtools';
     document.body.appendChild(devtoolsDiv);
   }

   const { queryEventClient, clientEventClient } = createEventClients();

   const devtools = new TanStackDevtoolsCore({
     config: {},
     plugins: [
       {
         id: 'queries',
         name: 'Query Log',
         // `render` is called with the plugin mount element. We subscribe to
         // the queryEventClient and update the local DOM when events arrive.
         render: (el: HTMLElement) => {
           el.style.padding = '8px';
           const title = document.createElement('div');
           title.textContent = 'Queries';
           title.style.fontWeight = '600';
           title.style.marginBottom = '6px';
           el.appendChild(title);

           const list = document.createElement('div');
           list.style.maxHeight = '300px';
           list.style.overflow = 'auto';
           list.style.fontFamily = 'monospace';
           el.appendChild(list);

           const formatTimestamp = (ts?: number) =>
             ts ? new Date(ts).toLocaleTimeString() : '?';

           const truncate = (s: string, n = 200) =>
             s.length > n ? s.slice(0, n) + '…' : s;

           const formatBytes = (b?: number) => {
             if (b == null) return '?';
             if (b < 1024) return `${b} B`;
             const units = ['KB', 'MB', 'GB', 'TB'];
             let i = -1;
             let v = b;
             do {
               v = v / 1024;
               i++;
             } while (v >= 1024 && i < units.length - 1);
             return `${v.toFixed(2)} ${units[i]}`;
           };

           const makeItem = (kind: string, payload: any) => {
             const item = document.createElement('div');
             item.style.padding = '6px';
             item.style.borderBottom = '1px solid rgba(255,255,255,1)';
             item.style.background = kind === 'start' ? 'rgba(0,0,255,0.02)' : 'rgba(0,128,0,0.02)';
             item.style.cursor = 'pointer';

             // Header row
             const header = document.createElement('div');
             header.style.display = 'flex';
             header.style.justifyContent = 'space-between';
             header.style.alignItems = 'center';

             const left = document.createElement('div');
             left.style.flex = '1';

             const badge = document.createElement('span');
             badge.textContent = kind.toUpperCase();
             badge.style.fontSize = '11px';
             badge.style.fontWeight = '700';
             badge.style.padding = '2px 6px';
             badge.style.borderRadius = '4px';
             badge.style.marginRight = '8px';
             badge.style.background = kind === 'start' ? '#e6f0ff' : '#e8fff0';
             badge.style.color = kind === 'start' ? '#0050d6' : '#0a7a2a';

             const q = document.createElement('span');
             q.textContent = truncate(payload.query ?? '<no query>');
             q.title = payload.query ?? '';

             left.appendChild(badge);
             left.appendChild(q);

             const meta = document.createElement('div');
             meta.style.marginLeft = '12px';
             meta.style.fontSize = '12px';
             meta.style.opacity = '0.85';
             meta.textContent = `${payload.clientId ?? 'unknown client'} • ${formatTimestamp(payload.timestamp)}`;

             left.appendChild(meta);

             header.appendChild(left);

             const right = document.createElement('div');
             right.style.textAlign = 'right';
             right.style.minWidth = '140px';
             right.style.fontSize = '12px';

             // show summary info on the right for 'end' events
             if (kind === 'end') {
               const rows = payload.numRows != null ? String(payload.numRows) : '?';
               const latency = payload.latencyMs != null ? `${payload.latencyMs} ms` : '?';
               const bytes = formatBytes(payload.numBytes);
               right.textContent = `${rows} rows • ${latency} • ${bytes}`;
             } else if (kind === 'start') {
               right.textContent = payload.materialized ? 'materialized' : 'not materialized';
             }

             header.appendChild(right);

             item.appendChild(header);

             // details (hidden by default)
             const details = document.createElement('div');
             details.style.marginTop = '8px';
             details.style.display = 'none';
             details.style.fontSize = '12px';

             // client id and materialized
             const info = document.createElement('div');
             info.style.marginBottom = '6px';
             info.textContent = `Client: ${payload.clientId ?? '—'} • Materialized: ${payload.materialized ? 'yes' : 'no'} • Timestamp: ${formatTimestamp(payload.timestamp)}`;
             details.appendChild(info);

             // latency / rows / bytes (for end)
             if (kind === 'end') {
               const stats = document.createElement('div');
               stats.style.marginBottom = '6px';
               stats.textContent = `Latency: ${payload.latencyMs != null ? payload.latencyMs + ' ms' : '?'} • Rows: ${payload.numRows ?? '?'} • Bytes: ${payload.numBytes != null ? formatBytes(payload.numBytes) : '?'}`;
               details.appendChild(stats);

               // exemplarRows preview (if present)
               if (Array.isArray(payload.exemplarRows) && payload.exemplarRows.length > 0) {
                 const previewTitle = document.createElement('div');
                 previewTitle.textContent = `Example rows (${payload.exemplarRows.length}):`;
                 previewTitle.style.fontWeight = '600';
                 previewTitle.style.marginBottom = '4px';
                 details.appendChild(previewTitle);

                 // build a simple table
                 const rows = payload.exemplarRows as Record<string, unknown>[];
                 const cols = new Set<string>();
                 // gather keys from up-to-first rows
                 for (let i = 0; i < Math.min(rows.length, 5); i++) {
                   Object.keys(rows[i] || {}).forEach((k) => cols.add(k));
                 }
                 const colList = Array.from(cols);

                 const table = document.createElement('table');
                 table.style.borderCollapse = 'collapse';
                 table.style.width = '100%';
                 table.style.fontSize = '12px';
                 table.style.marginBottom = '6px';

                 const thead = document.createElement('thead');
                 const headRow = document.createElement('tr');
                 for (const c of colList) {
                   const th = document.createElement('th');
                   th.textContent = c;
                   th.style.textAlign = 'left';
                   th.style.padding = '2px 6px';
                   th.style.borderBottom = '1px solid rgba(0,0,0,0.08)';
                   headRow.appendChild(th);
                 }
                 thead.appendChild(headRow);
                 table.appendChild(thead);

                 const tbody = document.createElement('tbody');
                 for (let r = 0; r < Math.min(rows.length, 5); r++) {
                   const rowEl = document.createElement('tr');
                   for (const c of colList) {
                     const td = document.createElement('td');
                     const val = rows[r][c];
                     td.textContent = val == null ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);
                     td.style.padding = '2px 6px';
                     td.style.borderBottom = '1px solid rgba(0,0,0,0.03)';
                     rowEl.appendChild(td);
                   }
                   tbody.appendChild(rowEl);
                 }
                 table.appendChild(tbody);
                 details.appendChild(table);
               }
             }

             // clicking toggles detail view
             item.addEventListener('click', () => {
               details.style.display = details.style.display === 'none' ? 'block' : 'none';
             });

             item.appendChild(details);
             list.prepend(item); // newest on top

             // keep list length reasonable
             const maxItems = 200;
             while (list.children.length > maxItems) {
               list.removeChild(list.lastChild as ChildNode);
             }
           };

           // Subscribe to start / end events
           // Note: EventClient#on(...) returns an unsubscribe in many implementations;
           // we ignore unsubscribe here for simplicity in a small dev UI.
           queryEventClient.on?.('start', (data) => {
             // payload typed as queries:start
             makeItem('start', data.payload);
           });
           queryEventClient.on?.('end', (data) => {
             // payload typed as queries:end
             makeItem('end', data.payload);
           });

           // no cleanup function is returned here; for a long-lived devtools UI
           // this is acceptable. If you mount/unmount dynamically, keep unsubscribers.
         },
       },
       {
         id: 'clients',
         name: 'Clients',
         render: (el: HTMLElement) => {
           el.style.padding = '8px';
           const title = document.createElement('div');
           title.textContent = 'Clients';
           title.style.fontWeight = '600';
           title.style.marginBottom = '6px';
           el.appendChild(title);

           const list = document.createElement('div');
           list.style.maxHeight = '200px';
           list.style.overflow = 'auto';
           list.style.fontFamily = 'monospace';
           el.appendChild(list);

           const renderClient = (c: ClientState, container: HTMLElement, depth = 0) => {
             const row = document.createElement('div');
             row.style.padding = '4px 0';
             row.style.marginLeft = `${depth * 12}px`;
             row.style.borderBottom = '1px solid rgba(0,0,0,0.04)';
             row.style.display = 'flex';
             row.style.justifyContent = 'space-between';
             row.style.alignItems = 'center';

             const left = document.createElement('div');
             left.style.display = 'flex';
             left.style.flexDirection = 'column';

             const idLine = document.createElement('div');
             idLine.textContent = `${c.clientId} — ${c.connected ? 'connected' : 'disconnected'}`;
             idLine.style.fontWeight = '600';
             left.appendChild(idLine);

             const metaLine = document.createElement('div');
             metaLine.style.fontSize = '12px';
             metaLine.style.opacity = '0.85';
             metaLine.textContent = `Last query: ${c.lastQuery ?? '—'}`;
             left.appendChild(metaLine);

             row.appendChild(left);

             const right = document.createElement('div');
             right.style.textAlign = 'right';
             right.style.fontSize = '12px';
             right.style.opacity = '0.9';
             right.textContent = `Latency: ${c.lastLatencyMs ?? '?'} ms • Rows: ${c.lastNumRows ?? '?'} • Bytes: ${c.lastNumBytes != null ? formatBytes(c.lastNumBytes) : '?'}`;
             row.appendChild(right);

             container.appendChild(row);

             if (Array.isArray(c.children) && c.children.length > 0) {
               for (const child of c.children) {
                 renderClient(child, container, depth + 1);
               }
             }
           };

           const renderState = (state: ClientEventTypes['clients:state']) => {
             list.replaceChildren();
             const header = document.createElement('div');
             header.textContent = `Connected: ${state.numConnectedClients} — filter groups: ${state.coordinatorState?.numFilterGroups ?? 0}`;
             header.style.marginBottom = '6px';
             header.style.fontSize = '13px';
             header.style.fontWeight = '600';
             list.appendChild(header);

             for (const c of state.clients) {
               renderClient(c, list);
             }
           };

           const formatBytes = (b?: number) => {
             if (b == null) return '?';
             if (b < 1024) return `${b} B`;
             const units = ['KB', 'MB', 'GB', 'TB'];
             let i = -1;
             let v = b;
             do {
               v = v / 1024;
               i++;
             } while (v >= 1024 && i < units.length - 1);
             return `${v.toFixed(2)} ${units[i]}`;
           };

           clientEventClient.on?.('state', (data) => {
             renderState(data.payload);
           });
         },
       },
     ],
   });

   devtools.mount(devtoolsDiv);
 }
