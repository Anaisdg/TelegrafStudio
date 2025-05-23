import { useState, useEffect } from 'react';
import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import { Node, PluginType } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { parseTomlConfig } from '@/utils/pluginParser';
import { PluginConfigForm } from '@/components/PluginConfigForm';
import { getDefaultPluginConfig } from '@/utils/telegraf';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface NodeConfigProps {
  node: Node;
}

export default function NodeConfig({ node }: NodeConfigProps) {
  const { telegrafConfig, setTelegrafConfig } = useTelegrafConfig();
  const [nodeData, setNodeData] = useState<any>({ ...node.data });
  const [loading, setLoading] = useState(false);
  const [pluginConfig, setPluginConfig] = useState<any>(null);
  const { toast } = useToast();
  
  // States for filter fields
  const [namepass, setNamepass] = useState<string>('');
  const [fieldpass, setFieldpass] = useState<string>('');
  const [tagpassEntries, setTagpassEntries] = useState<{key: string, values: string}[]>([]);
  const [newTagKey, setNewTagKey] = useState<string>('');
  const [newTagValues, setNewTagValues] = useState<string>('');
  
  // Determine if this plugin type can have these filters based on rules
  const canUseNamepass = node.type === PluginType.PROCESSOR || 
                         node.type === PluginType.AGGREGATOR || 
                         node.type === PluginType.OUTPUT;
                         
  // All plugin types can use fieldpass/tagpass
  const canUseFieldpass = true;

  useEffect(() => {
    setNodeData({ ...node.data });
    loadPluginConfig();
    console.log("Selected node:", node);
    
    // Initialize filter fields from node data
    if (node.data) {
      // Handle namepass
      if (node.data.namepass) {
        const namepassValue = Array.isArray(node.data.namepass) 
          ? node.data.namepass.join(', ') 
          : node.data.namepass;
        setNamepass(namepassValue);
      } else {
        // For output nodes, try to auto-populate the namepass field based on connected inputs
        if (node.type === PluginType.OUTPUT) {
          const inputNodes = telegrafConfig.nodes.filter(n => n.type === PluginType.INPUT);
          
          // Function to trace connections recursively from any node to the target output
          const tracePath = (nodeId: string, visited = new Set<string>()): boolean => {
            // If we already visited this node, don't recurse 
            if (visited.has(nodeId)) return false;
            
            // Mark this node as visited
            visited.add(nodeId);
            
            // Check if this node has a direct connection to the output
            const directConnection = telegrafConfig.connections.some(conn => 
              conn.source === nodeId && conn.target === node.id
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
          
          const allInputsConnected = connectedInputs.length === inputNodes.length;
          
          // Only generate a namepass if not all inputs are connected
          if (!allInputsConnected && connectedInputs.length > 0) {
            const metricNames = connectedInputs.map(input => input.plugin);
            setNamepass(metricNames.join(', '));
            console.log(`Pre-populated namepass field for ${node.plugin}: ${metricNames.join(', ')}`);
          } else {
            setNamepass('');
          }
        } else {
          setNamepass('');
        }
      }
      
      // Handle fieldpass
      if (node.data.fieldpass) {
        const fieldpassValue = Array.isArray(node.data.fieldpass) 
          ? node.data.fieldpass.join(', ') 
          : node.data.fieldpass;
        setFieldpass(fieldpassValue);
      } else {
        setFieldpass('');
      }
      
      // Handle tagpass (complex object structure)
      if (node.data.tagpass && typeof node.data.tagpass === 'object') {
        const tagpassObj = node.data.tagpass;
        const entries = Object.entries(tagpassObj).map(([key, values]) => {
          // Convert array of values to comma-separated string
          const valuesStr = Array.isArray(values) 
            ? values.join(', ') 
            : String(values);
          
          return { key, values: valuesStr };
        });
        
        setTagpassEntries(entries);
      } else {
        setTagpassEntries([]);
      }
    }
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

  // Helper to add a tag entry
  const addTagEntry = () => {
    if (newTagKey && newTagValues) {
      setTagpassEntries([...tagpassEntries, { key: newTagKey, values: newTagValues }]);
      setNewTagKey('');
      setNewTagValues('');
    }
  };
  
  // Helper to remove a tag entry
  const removeTagEntry = (index: number) => {
    const newEntries = [...tagpassEntries];
    newEntries.splice(index, 1);
    setTagpassEntries(newEntries);
  };
  
  // Handle applying filter changes
  const handleApplyFilters = () => {
    const updatedNodeData = { ...nodeData };
    
    // Special logic for output plugins and namepass inheritance
    if (node.type === PluginType.OUTPUT) {
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
          conn.source === nodeId && conn.target === node.id
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
      
      // If all inputs are connected to this output, no need for namepass
      // Otherwise, we need to inherit namepass from the connected inputs
      if (!allInputsConnected && connectedInputs.length > 0) {
        // Collect all metric names from connected inputs
        const metricNames = new Set<string>();
        
        // For each connected input, get the metrics it produces
        connectedInputs.forEach(input => {
          // For this demo, we'll assume each input plugin is named after the metric it produces
          // In a real app, you would get this from plugin metadata or configuration
          metricNames.add(input.plugin);
        });
        
        // Set the namepass to include only the metrics from connected inputs
        if (metricNames.size > 0) {
          updatedNodeData.namepass = Array.from(metricNames);
          console.log(`Auto-generated namepass for output: ${updatedNodeData.namepass.join(', ')}`);
        }
      } else if (namepass.trim()) {
        // If user specified a custom namepass, still use it
        updatedNodeData.namepass = namepass.split(',').map(item => item.trim()).filter(Boolean);
      } else if (allInputsConnected) {
        // All inputs connect to this output, so no namepass needed
        delete updatedNodeData.namepass;
      }
    } 
    // Regular processing for non-output plugins that can use namepass
    else if (canUseNamepass) {
      if (namepass.trim()) {
        updatedNodeData.namepass = namepass.split(',').map(item => item.trim()).filter(Boolean);
      } else {
        delete updatedNodeData.namepass;
      }
    }
    
    // Process fieldpass if this plugin can use it
    if (canUseFieldpass) {
      if (fieldpass.trim()) {
        updatedNodeData.fieldpass = fieldpass.split(',').map(item => item.trim()).filter(Boolean);
      } else {
        delete updatedNodeData.fieldpass;
      }
    }
    
    // Process tagpass entries (all plugins can use tagpass)
    if (tagpassEntries.length > 0) {
      const tagpassObj: Record<string, string[]> = {};
      
      // Convert entries to the proper format
      tagpassEntries.forEach(entry => {
        if (entry.key && entry.values) {
          // Split comma-separated values into array
          tagpassObj[entry.key] = entry.values.split(',').map(v => v.trim()).filter(Boolean);
        }
      });
      
      if (Object.keys(tagpassObj).length > 0) {
        updatedNodeData.tagpass = tagpassObj;
      } else {
        delete updatedNodeData.tagpass;
      }
    } else {
      delete updatedNodeData.tagpass;
    }
    
    // Update the node data
    setNodeData(updatedNodeData);
    
    // Update the telegraf config
    const updatedNodes = telegrafConfig.nodes.map((n) => {
      if (n.id === node.id) {
        return {
          ...n,
          data: updatedNodeData,
        };
      }
      return n;
    });
    
    setTelegrafConfig({
      ...telegrafConfig,
      nodes: updatedNodes,
    });
    
    toast({
      title: 'Filters Updated',
      description: `Filters for ${node.plugin} have been updated`,
    });
  };
  
  // Render the filters tab
  const renderFiltersTab = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Metric and Field Filtering</h3>
          <p className="text-sm text-gray-600">Configure which metrics and fields this plugin will process</p>
        </div>
        
        {canUseNamepass && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="namepass" className="font-medium">Namepass</Label>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Metric Names</Badge>
            </div>
            
            {node.type === PluginType.OUTPUT && (
              <div className="bg-blue-50 text-blue-800 p-2 rounded-md text-xs">
                <strong>Note:</strong> Output plugins automatically inherit namepass filter based on connected inputs.
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>If all input plugins connect to this output (directly or through processors), no namepass is needed</li>
                  <li>If only some inputs connect, namepass will include just those metrics</li>
                  <li>Connections through intermediate processor plugins are automatically traced</li>
                  <li>You can still override with your own namepass values below</li>
                </ul>
              </div>
            )}
            
            <p className="text-xs text-gray-500">Comma-separated list of metric names to include (matches exact metric names)</p>
            <Textarea
              id="namepass"
              placeholder="cpu, mem, disk"
              value={namepass}
              onChange={(e) => setNamepass(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        )}
        
        {canUseFieldpass && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="fieldpass" className="font-medium">Fieldpass</Label>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Field Names</Badge>
            </div>
            <p className="text-xs text-gray-500">Comma-separated list of fields to include (supports wildcards with *)</p>
            <Textarea
              id="fieldpass"
              placeholder="usage_*, uptime, value"
              value={fieldpass}
              onChange={(e) => setFieldpass(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="tagpass" className="font-medium">Tagpass</Label>
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">Tags</Badge>
          </div>
          <p className="text-xs text-gray-500">
            Filter measurements based on tag values. Format: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">tag = ["value1", "value2"]</code>
          </p>
          
          {/* Tag entry form */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tagKey" className="text-xs">Tag Name</Label>
              <Input 
                id="tagKey"
                placeholder="host"
                value={newTagKey}
                onChange={(e) => setNewTagKey(e.target.value)}
                className="text-sm mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tagValues" className="text-xs">Tag Values (comma-separated)</Label>
              <Input 
                id="tagValues"
                placeholder="web-01, web-02"
                value={newTagValues}
                onChange={(e) => setNewTagValues(e.target.value)}
                className="text-sm mt-1"
              />
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="w-full text-sm"
            onClick={addTagEntry}
            disabled={!newTagKey || !newTagValues}
          >
            + Add Tag Filter
          </Button>
          
          {/* Existing tag entries */}
          {tagpassEntries.length > 0 && (
            <div className="mt-3 border rounded-md p-3 space-y-2 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700">Configured Tag Filters</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tagpassEntries.map((entry, index) => (
                  <div key={index} className="bg-white p-2 rounded border flex justify-between items-center">
                    <div className="font-mono text-sm">
                      {entry.key} = ["{entry.values.split(',').map(v => v.trim()).join('", "')}"]
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={() => removeTagEntry(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="pt-2">
          <Button 
            variant="default"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4" id="node-config">
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="config">Plugin Config</TabsTrigger>
          <TabsTrigger value="filters">Filtering</TabsTrigger>
        </TabsList>
        
        <TabsContent value="config">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="filters">
          {renderFiltersTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
