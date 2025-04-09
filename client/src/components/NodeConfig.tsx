import { useState, useEffect } from 'react';
import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import { Node } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { parseTomlConfig } from '@/utils/pluginParser';
import { PluginConfigForm } from '@/components/PluginConfigForm';
import { getDefaultPluginConfig } from '@/utils/telegraf';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NodeConfigProps {
  node: Node;
}

export default function NodeConfig({ node }: NodeConfigProps) {
  const { telegrafConfig, setTelegrafConfig } = useTelegrafConfig();
  const [nodeData, setNodeData] = useState<any>({ ...node.data });
  const [loading, setLoading] = useState(false);
  const [pluginConfig, setPluginConfig] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    setNodeData({ ...node.data });
    loadPluginConfig();
    console.log("Selected node:", node);
  }, [node]);

  const loadPluginConfig = async () => {
    setLoading(true);
    console.log("Loading plugin config for:", node.plugin, node.type);
    
    try {
      // Get the node type (input, output, processor)
      const nodeType = node.type === 'input' ? 'inputs' : 
                      node.type === 'output' ? 'outputs' : 'processors';
      
      // For demo purposes, use the predefined config for influxdb_v2
      // In production, we would fetch this from GitHub or a local cache
      if (node.plugin === 'influxdb_v2') {
        console.log("Processing influxdb_v2 config");
        const sampleConfig = `# Configuration for sending metrics to InfluxDB 2.0
[[outputs.influxdb_v2]]
  # The URLs of the InfluxDB cluster nodes.
  #
  # Multiple URLs can be specified for a single cluster, only ONE of the
  # urls will be written to each interval.
  #   ex: urls = ["https://us-west-2-1.aws.cloud2.influxdata.com"]
  urls = ["http://127.0.0.1:8086"]

  # Local address to bind when connecting to the server
  # If empty or not set, the local address is automatically chosen.
  # local_address = ""

  # Token for authentication.
  token = ""

  # Organization is the name of the organization you wish to write to.
  organization = ""

  # Destination bucket to write into.
  bucket = ""

  # The value of this tag will be used to determine the bucket.  If this
  # tag is not set the 'bucket' option is used as the default.
  # bucket_tag = ""

  # If true, the bucket tag will not be added to the metric.
  # exclude_bucket_tag = false

  # Timeout for HTTP messages.
  # timeout = "5s"

  # Additional HTTP headers
  # http_headers = {"X-Custom-Header" = "custom-value"}

  # HTTP Proxy override, if unset values the standard proxy environment
  # variables are consulted to determine which proxy, if any, should be used.
  # http_proxy = "http://corporate.proxy:3128"

  # HTTP User-Agent
  # user_agent = "telegraf"

  # Content-Encoding for write request body, can be set to "gzip" to
  # compress body or "identity" to apply no encoding.
  # content_encoding = "gzip"

  # Enable or disable uint support for writing uints influxdb 2.0.
  # influx_uint_support = false

  # When true, Telegraf will omit the timestamp on data to allow InfluxDB
  # to set the timestamp of the data during ingestion. This is generally NOT
  # what you want as it can lead to data points captured at different times
  # getting omitted due to similar data.
  # influx_omit_timestamp = false`;
          
        const config = parseTomlConfig(sampleConfig, 'influxdb_v2', 'output');
        setPluginConfig(config);
      } else {
        // For other plugins, use default configs for the demo
        // In real app, we would fetch from GitHub
        const defaultConfig = getDefaultPluginConfig(node.plugin, node.type);
        if (defaultConfig) {
          setPluginConfig(defaultConfig);
        } else {
          toast({
            title: 'Plugin Config Not Found',
            description: `Configuration not available for ${node.plugin}`,
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Error loading plugin config:', error);
      toast({
        title: 'Failed to load plugin configuration',
        description: `Could not load configuration for ${node.plugin}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataChange = (key: string, value: any) => {
    setNodeData({
      ...nodeData,
      [key]: value,
    });
  };

  const handleNestedDataChange = (parent: string, key: string, value: any) => {
    setNodeData({
      ...nodeData,
      [parent]: {
        ...nodeData[parent],
        [key]: value,
      },
    });
  };

  const handleApplyChanges = () => {
    const updatedNodes = telegrafConfig.nodes.map((n) => {
      if (n.id === node.id) {
        return {
          ...n,
          data: nodeData,
        };
      }
      return n;
    });

    setTelegrafConfig({
      ...telegrafConfig,
      nodes: updatedNodes,
    });
    
    toast({
      title: 'Configuration Updated',
      description: `${node.plugin} configuration has been updated`,
    });
  };

  // Special forms for plugins that need custom UI
  const renderConverterForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Fields to Process</Label>
        <div className="flex items-center text-sm bg-gray-50 p-2 rounded">
          <Checkbox 
            id="field_usage" 
            checked={(nodeData.fields?.integer || []).includes('usage_*')}
            onCheckedChange={(checked) => {
              const integer = nodeData.fields?.integer || [];
              if (checked) {
                handleNestedDataChange('fields', 'integer', [...integer, 'usage_*']);
              } else {
                handleNestedDataChange('fields', 'integer', integer.filter((f: string) => f !== 'usage_*'));
              }
            }}
            className="mr-2"
          />
          <Label htmlFor="field_usage">usage_*</Label>
        </div>
        <div className="flex items-center text-sm bg-gray-50 p-2 rounded">
          <Checkbox 
            id="field_time" 
            checked={(nodeData.fields?.integer || []).includes('time_*')}
            onCheckedChange={(checked) => {
              const integer = nodeData.fields?.integer || [];
              if (checked) {
                handleNestedDataChange('fields', 'integer', [...integer, 'time_*']);
              } else {
                handleNestedDataChange('fields', 'integer', integer.filter((f: string) => f !== 'time_*'));
              }
            }}
            className="mr-2"
          />
          <Label htmlFor="field_time">time_*</Label>
        </div>
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Conversion Type</Label>
        <Select 
          value={Object.keys(nodeData.fields || {})[0] || 'integer'} 
          onValueChange={(value) => {
            const fieldValues = nodeData.fields ? Object.values(nodeData.fields)[0] : [];
            const newFields = { [value]: fieldValues };
            handleDataChange('fields', newFields);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select conversion type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="integer">Integer</SelectItem>
            <SelectItem value="float">Float</SelectItem>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Filter Expression</Label>
        <div className="mb-1 flex justify-between items-center">
          <span className="text-xs text-gray-500">Based on tag/field filters</span>
          <Button variant="link" size="sm" className="text-xs text-blue-600 hover:text-blue-800">
            Advanced Filtering
          </Button>
        </div>
        <Textarea 
          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm font-mono"
          rows={3}
          value={`namepass = ["cpu"]`}
          onChange={(e) => console.log('Filter expression changed')}
        />
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <Button 
          variant="default"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleApplyChanges}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );

  // Render content based on whether we have parsed plugin config
  const renderContent = () => {
    // For converter plugin, use the custom form
    if (node.plugin === 'converter') {
      return renderConverterForm();
    }
    
    // For plugins with parsed config, use the generic form
    if (pluginConfig) {
      return (
        <PluginConfigForm 
          pluginConfig={pluginConfig} 
          currentValues={nodeData}
          onChange={handleDataChange}
          onSave={handleApplyChanges}
        />
      );
    }
    
    // Loading state
    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    // Fallback for plugins without config
    return (
      <div className="text-center text-gray-500 py-10">
        <p>No configuration available for this plugin</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={loadPluginConfig}
        >
          Retry Loading Config
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4" id="node-config">
      {renderContent()}
    </div>
  );
}
