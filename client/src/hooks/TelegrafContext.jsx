import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Default agent configuration
const defaultAgentConfig = {
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
const defaultConfig = {
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
const TelegrafConfigContext = createContext({
  telegrafConfig: defaultConfig,
  setTelegrafConfig: () => {},
  selectedNode: null,
  setSelectedNode: () => {},
  selectedConnection: null,
  setSelectedConnection: () => {},
});

// Provider component
export function TelegrafConfigProvider({ children }) {
  const [telegrafConfig, setTelegrafConfig] = useState(defaultConfig);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);

  const value = {
    telegrafConfig,
    setTelegrafConfig,
    selectedNode,
    setSelectedNode,
    selectedConnection,
    setSelectedConnection
  };

  return (
    <TelegrafConfigContext.Provider value={value}>
      {children}
    </TelegrafConfigContext.Provider>
  );
}

// Hook to use telegraf configuration
export function useTelegrafConfig() {
  const context = useContext(TelegrafConfigContext);
  
  if (!context) {
    throw new Error('useTelegrafConfig must be used within a TelegrafConfigProvider');
  }
  
  return context;
}

// Export the hook as default
export default useTelegrafConfig;