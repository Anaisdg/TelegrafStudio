import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import { Connection } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ConnectionConfigProps {
  connection: Connection;
}

export default function ConnectionConfig({ connection }: ConnectionConfigProps) {
  const { telegrafConfig } = useTelegrafConfig();
  
  // Find source and target nodes
  const sourceNode = telegrafConfig.nodes.find(n => n.id === connection.source);
  const targetNode = telegrafConfig.nodes.find(n => n.id === connection.target);
  
  return (
    <div className="space-y-4 p-2" id="connection-config">
      <div className="bg-blue-50 text-blue-800 p-4 rounded-md flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
        <div>
          <h3 className="font-medium">Connection Information</h3>
          <p className="text-sm mt-1">
            This connection links {sourceNode?.plugin || 'source'} to {targetNode?.plugin || 'target'}.
          </p>
          <p className="text-sm mt-2 text-blue-600">
            Filtering is now configured directly in each plugin's configuration panel. Select a plugin node and use the "Filtering" tab to configure namepass, fieldpass, and tagpass filters.
          </p>
        </div>
      </div>
      
      <div className="border rounded p-3 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700">Connection Details</h4>
        <div className="mt-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-500">From:</div>
            <div>{sourceNode?.plugin || 'Unknown'} ({sourceNode?.type || 'unknown'})</div>
            <div className="text-gray-500">To:</div>
            <div>{targetNode?.plugin || 'Unknown'} ({targetNode?.type || 'unknown'})</div>
          </div>
        </div>
      </div>
    </div>
  );
}
