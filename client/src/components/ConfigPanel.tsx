import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import NodeConfig from '@/components/NodeConfig';
import ConnectionConfig from '@/components/ConnectionConfig';
import AgentConfig from '@/components/AgentConfig';
import SecretConfig from '@/components/SecretConfig';
import SecretStoreConfig from '@/components/SecretStoreConfig';
import { useEffect, useState } from 'react';

export default function ConfigPanel() {
  const { selectedNode, selectedConnection } = useTelegrafConfig();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  
  // Listen for telegraf-panel-change events
  useEffect(() => {
    const handlePanelChange = (e: CustomEvent) => {
      setActivePanel(e.detail.panel);
    };
    
    // Get initial state from localStorage if available
    const storedState = localStorage.getItem('telegrafAppState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        setActivePanel(state.activePanel || null);
      } catch (e) {
        console.error('Failed to parse stored state:', e);
      }
    }
    
    // Add event listener for panel changes
    window.addEventListener('telegraf-panel-change', handlePanelChange as EventListener);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('telegraf-panel-change', handlePanelChange as EventListener);
    };
  }, []);
  
  // When node or connection is selected, clear the active panel
  useEffect(() => {
    if (selectedNode || selectedConnection) {
      setActivePanel(null);
    }
  }, [selectedNode, selectedConnection]);

  // Determine which configuration component to render
  const renderConfigComponent = () => {
    // If a node is selected, it takes precedence
    if (selectedNode) {
      return <NodeConfig node={selectedNode} />;
    }

    // If a connection is selected, render its config
    if (selectedConnection) {
      return <ConnectionConfig connection={selectedConnection} />;
    }
    
    // Handle special panel types based on the activePanel state
    switch (activePanel) {
      case 'secret-store-config':
        return <SecretStoreConfig />;
      case 'agent-config':
        return <AgentConfig />;
      default:
        // Default empty state when nothing is selected
        return (
          <div className="text-center text-gray-500 py-10">
            <i className="ri-information-line text-4xl mb-2"></i>
            <p>Select a node or connection to configure</p>
          </div>
        );
    }
  };

  // Set the configuration title based on selection
  const getConfigTitle = () => {
    if (selectedNode) {
      return `${selectedNode.plugin} Configuration`;
    }
    if (selectedConnection) {
      return 'Connection Filter';
    }
    if (activePanel === 'secret-store-config') {
      return 'Secret Store Configuration';
    }
    if (activePanel === 'agent-config') {
      return 'Agent Configuration';
    }
    return 'Plugin Configuration';
  };

  // Set the configuration subtitle based on selection
  const getConfigSubtitle = () => {
    if (selectedNode) {
      return `${selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)} Plugin Settings`;
    }
    if (selectedConnection) {
      return `${selectedConnection.source} → ${selectedConnection.target}`;
    }
    if (activePanel === 'secret-store-config') {
      return 'Configure secret store and manage secrets';
    }
    if (activePanel === 'agent-config') {
      return 'Global Telegraf agent settings';
    }
    return 'Select a plugin to configure';
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col" id="config-panel">
      {/* Configuration Title */}
      <div className="bg-gray-100 p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold" id="config-title">
          {getConfigTitle()}
        </h2>
        <p className="text-sm text-gray-600" id="config-subtitle">
          {getConfigSubtitle()}
        </p>
      </div>

      {/* Configuration Form */}
      <div className="flex-1 overflow-y-auto p-4" id="config-form">
        {renderConfigComponent()}
      </div>
    </div>
  );
}
