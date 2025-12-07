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
    clientId: string;
    latencyMs: number;
    numRows: number;
    numBytes: number;
    exemplarRows: Record<string, unknown>[]; // first ~10 rows
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

export function createEventClients() {
  const queryEventClient = new EventClient<QueryEventTypes>({ pluginId: 'queries', debug: true });
  const clientEventClient = new EventClient<ClientEventTypes>({ pluginId: 'clients', debug: true });

  return { queryEventClient, clientEventClient };
}

export function initializeDevtools(document: Document) {
  const devtoolsDiv = document.createElement('div');
  devtoolsDiv.id = 'devtools';
  document.body.appendChild(devtoolsDiv);

  const devtools = new TanStackDevtoolsCore({
    config: {},
    plugins: [
      {
        id: 'queries',
        name: 'Query Log',
        render: (el) => {el.innerHTML = '<div>My Plugin Content</div>'},
      },
    ],
  })

  devtools.mount(document.getElementById('devtools')!)
}
