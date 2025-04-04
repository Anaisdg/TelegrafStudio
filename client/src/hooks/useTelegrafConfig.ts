import * as React from 'react';
import { useState, createContext, useContext } from 'react';
import { TelegrafConfig, Node, Connection, AgentConfig } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

// Default agent configuration
const defaultAgentConfig: AgentConfig = {
  interval: '10s',
  round_interval: true,
  metric_batch_size: 1000,
  metric_buffer_limit: 10000,
  collection_jitter: '0s',
  flush_interval: '10s',
  flush_jitter: '0s',
  precision: '',
  debug: false,
  quiet: false,
  logtarget: 'file',
  logfile: '',
  logfile_rotation_interval: '0d',
  logfile_rotation_max_size: '0MB',
  logfile_rotation_max_archives: 5,
};

// Default telegraf configuration
const defaultConfig: TelegrafConfig = {
  id: uuidv4(),
  name: 'my_telegraf_config',
  agent: defaultAgentConfig,
  nodes: [],
  connections: [],
  secretStores: [
    {
      id: 'mystore',
      type: 'os',
      data: {},
    },
  ],
};

// Create context for telegraf configuration
export interface TelegrafConfigContextType {
  telegrafConfig: TelegrafConfig;
  setTelegrafConfig: (config: TelegrafConfig) => void;
  selectedNode: Node | null;
  setSelectedNode: (node: Node | null) => void;
  selectedConnection: Connection | null;
  setSelectedConnection: (connection: Connection | null) => void;
}

// Create a context with default values
const TelegrafConfigContext = createContext<TelegrafConfigContextType>({
  telegrafConfig: defaultConfig,
  setTelegrafConfig: () => {},
  selectedNode: null,
  setSelectedNode: () => {},
  selectedConnection: null,
  setSelectedConnection: () => {},
});

// Provider component
export function TelegrafConfigProvider({ children }: { children: React.ReactNode }) {
  const [telegrafConfig, setTelegrafConfig] = useState<TelegrafConfig>(defaultConfig);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

  // Create the value object that will be provided to consumers
  const contextValue: TelegrafConfigContextType = {
    telegrafConfig,
    setTelegrafConfig,
    selectedNode,
    setSelectedNode,
    selectedConnection,
    setSelectedConnection
  };

  return React.createElement(
    TelegrafConfigContext.Provider,
    { value: contextValue },
    children
  );
}

// Hook to use telegraf configuration
export function useTelegrafConfig(): TelegrafConfigContextType {
  const context = useContext(TelegrafConfigContext);
  
  if (!context) {
    throw new Error('useTelegrafConfig must be used within a TelegrafConfigProvider');
  }
  
  return context;
}

// Export the hook as default
export default useTelegrafConfig;
