import { useState, useEffect } from 'react';
import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import { Node, SecretStore } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SecretConfigProps {
  node: Node;
}

export default function SecretConfig({ node }: SecretConfigProps) {
  const { telegrafConfig, setTelegrafConfig } = useTelegrafConfig();
  const [storeId, setStoreId] = useState<string>('mystore');
  
  // Find existing secret store or use default
  useEffect(() => {
    if (telegrafConfig.secretStores && telegrafConfig.secretStores.length > 0) {
      setStoreId(telegrafConfig.secretStores[0].id);
    }
  }, [telegrafConfig.secretStores]);

  const handleApplyConfiguration = () => {
    // Update or create the secret store
    let updatedSecretStores: SecretStore[] = [];
    
    if (telegrafConfig.secretStores && telegrafConfig.secretStores.length > 0) {
      // Update existing secret store
      updatedSecretStores = telegrafConfig.secretStores.map((store) => {
        if (store.id === storeId) {
          return { ...store };
        }
        return store;
      });
    } else {
      // Create new secret store
      updatedSecretStores = [
        {
          id: storeId,
          type: 'os',
          data: {}
        }
      ];
    }
    
    setTelegrafConfig({
      ...telegrafConfig,
      secretStores: updatedSecretStores
    });
  };

  return (
    <form className="space-y-4" id="secret-config">
      <h3 className="font-medium">Secret Store Configuration</h3>
      <p className="text-sm text-gray-600 mb-4">Configure the Linux OS secret store</p>
      
      <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4">
        <p><i className="ri-information-line mr-1"></i> Secrets are stored and retrieved using the OS keyring. You'll need to add secrets using the Telegraf CLI.</p>
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Secret Store ID</Label>
        <Input 
          type="text" 
          className="w-full" 
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Used to reference this store in configurations</p>
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Secret Reference Format</Label>
        <Input 
          type="text" 
          readOnly 
          className="w-full bg-gray-100 border border-gray-300 font-mono" 
          value={`@{${storeId}:key_name}`}
        />
        <p className="text-xs text-gray-500 mt-1">Use this format in your configuration to reference secrets</p>
      </div>
      
      <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
        <p className="font-medium">Command to add secrets:</p>
        <pre className="mt-1 bg-gray-800 text-gray-200 p-2 rounded text-xs overflow-x-auto">
          telegraf secrets set --token {storeId} influx_token
        </pre>
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <Button 
          type="button"
          variant="default"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleApplyConfiguration}
        >
          Apply Configuration
        </Button>
      </div>
    </form>
  );
}
