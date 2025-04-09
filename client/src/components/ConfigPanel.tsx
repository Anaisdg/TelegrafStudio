import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import NodeConfig from '@/components/NodeConfig';
import ConnectionConfig from '@/components/ConnectionConfig';
import AgentConfig from '@/components/AgentConfig';
import SecretConfig from '@/components/SecretConfig';

export default function ConfigPanel() {
  const { selectedNode, selectedConnection } = useTelegrafConfig();

  // Determine which configuration component to render
  const renderConfigComponent = () => {
    if (selectedNode) {
      // For testing our new NodeConfig with the parser, let's show it for all plugins
      return <NodeConfig node={selectedNode} />;
    }

    if (selectedConnection) {
      return <ConnectionConfig connection={selectedConnection} />;
    }

    // Default render the agent config if nothing is selected
    return (
      <>
        <div className="text-center text-gray-500 py-10" id="empty-config">
          <i className="ri-information-line text-4xl mb-2"></i>
          <p>Select a node or connection to configure</p>
        </div>
        
        <div className="hidden" id="agent-config">
          <AgentConfig />
        </div>
      </>
    );
  };

  // Set the configuration title based on selection
  const getConfigTitle = () => {
    if (selectedNode) {
      return `${selectedNode.plugin} Configuration`;
    }
    if (selectedConnection) {
      return 'Connection Filter';
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
