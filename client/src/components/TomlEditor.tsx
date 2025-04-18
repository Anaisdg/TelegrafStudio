import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import { convertConfigToToml } from '@/utils/telegraf';
import { PluginType } from '@shared/schema';

export default function TomlEditor() {
  const { telegrafConfig, setTelegrafConfig } = useTelegrafConfig();
  const [tomlValue, setTomlValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Convert the telegrafConfig to TOML when it changes
  useEffect(() => {
    try {
      // First, apply automatic namepass for output plugins
      let updatedConfig = {...telegrafConfig};
      const outputNodes = telegrafConfig.nodes.filter(node => node.type === PluginType.OUTPUT);
      
      // For each output node, check if it needs namepass
      outputNodes.forEach(outputNode => {
        // Get all input plugins
        const inputNodes = telegrafConfig.nodes.filter(n => n.type === PluginType.INPUT);
        
        // Function to trace connections recursively from any node to the target output
        const tracePath = (nodeId: string, visited = new Set<string>()): boolean => {
          // If we already visited this node, don't recurse 
          if (visited.has(nodeId)) return false;
          
          // Mark this node as visited
          visited.add(nodeId);
          
          // Check if this node has a direct connection to the output
          const directConnection = telegrafConfig.connections.some(conn => 
            conn.source === nodeId && conn.target === outputNode.id
          );
          
          if (directConnection) return true;
          
          // Check if this node connects to another node that eventually connects to the output
          return telegrafConfig.connections
            .filter(conn => conn.source === nodeId)
            .some(conn => tracePath(conn.target, new Set(visited)));
        };
        
        // Get input plugins that have a path to this output
        const connectedInputs = inputNodes.filter(input => {
          return tracePath(input.id);
        });
        
        // Check if ALL input plugins connect to this output
        const allInputsConnected = connectedInputs.length === inputNodes.length;
        
        // Update the node data with namepass if needed
        if (!allInputsConnected && connectedInputs.length > 0) {
          // Collect all metric names from connected inputs
          const metricNames = connectedInputs.map(input => input.plugin);
          
          // Update the output node with namepass
          const updatedNodes = updatedConfig.nodes.map(node => {
            if (node.id === outputNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  namepass: metricNames
                }
              };
            }
            return node;
          });
          
          // Update the config with the new nodes
          updatedConfig = {
            ...updatedConfig,
            nodes: updatedNodes
          };
          
          console.log(`TOML Editor: Auto-generated namepass for ${outputNode.plugin}: ${metricNames.join(', ')}`);
        }
      });
      
      // Now generate TOML from the updated config
      const toml = convertConfigToToml(updatedConfig);
      setTomlValue(toml);
      setError(null);
    } catch (err) {
      setError(`Error generating TOML: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [telegrafConfig]);

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    
    setTomlValue(value);
    
    // TODO: In a full implementation, we would parse TOML back to telegrafConfig
    // This would involve adding a TOML parser like @iarna/toml and implementing
    // the parseTomlToConfig function in utils/telegraf.ts
    
    // For now, we just display the TOML without syncing back to the visual editor
    // parseTomlToConfig(value).then(config => {
    //   setTelegrafConfig(config);
    // }).catch(err => {
    //   setError(`Error parsing TOML: ${err.message}`);
    // });
  };

  return (
    <div className="flex-1 bg-gray-800 text-white font-mono" id="toml-editor">
      {error && (
        <div className="bg-red-600 text-white p-2 text-sm">
          {error}
        </div>
      )}
      <Editor
        height="100%"
        defaultLanguage="toml"
        value={tomlValue}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  );
}
