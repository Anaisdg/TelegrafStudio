import { useState, useEffect } from 'react';
import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import { Node } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NodeConfigProps {
  node: Node;
}

export default function NodeConfig({ node }: NodeConfigProps) {
  const { telegrafConfig, setTelegrafConfig } = useTelegrafConfig();
  const [nodeData, setNodeData] = useState<any>({ ...node.data });

  useEffect(() => {
    setNodeData({ ...node.data });
  }, [node]);

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
  };

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
    </div>
  );

  const renderCpuForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center">
          <Checkbox 
            id="percpu" 
            checked={nodeData.percpu === true}
            onCheckedChange={(checked) => handleDataChange('percpu', checked === true)}
            className="mr-2"
          />
          <Label htmlFor="percpu">Collect per-CPU metrics</Label>
        </div>
        <div className="flex items-center">
          <Checkbox 
            id="totalcpu" 
            checked={nodeData.totalcpu === true}
            onCheckedChange={(checked) => handleDataChange('totalcpu', checked === true)}
            className="mr-2"
          />
          <Label htmlFor="totalcpu">Collect total CPU metrics</Label>
        </div>
        <div className="flex items-center">
          <Checkbox 
            id="collect_cpu_time" 
            checked={nodeData.collect_cpu_time === true}
            onCheckedChange={(checked) => handleDataChange('collect_cpu_time', checked === true)}
            className="mr-2"
          />
          <Label htmlFor="collect_cpu_time">Collect CPU time metrics</Label>
        </div>
        <div className="flex items-center">
          <Checkbox 
            id="report_active" 
            checked={nodeData.report_active === true}
            onCheckedChange={(checked) => handleDataChange('report_active', checked === true)}
            className="mr-2"
          />
          <Label htmlFor="report_active">Report active time metrics</Label>
        </div>
      </div>
    </div>
  );

  const renderMemForm = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 italic">
        No specific configuration for memory plugin
      </div>
    </div>
  );

  const renderInfluxDbForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">URLs</Label>
        <Input 
          className="w-full"
          value={Array.isArray(nodeData.urls) ? nodeData.urls[0] : "http://localhost:8086"}
          onChange={(e) => handleDataChange('urls', [e.target.value])}
        />
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Organization</Label>
        <Input 
          className="w-full"
          value={nodeData.organization || "my-org"}
          onChange={(e) => handleDataChange('organization', e.target.value)}
        />
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Bucket</Label>
        <Input 
          className="w-full"
          value={nodeData.bucket || "telegraf"}
          onChange={(e) => handleDataChange('bucket', e.target.value)}
        />
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Token</Label>
        <Input 
          className="w-full font-mono"
          value={nodeData.token || "@{mystore:influx_token}"}
          onChange={(e) => handleDataChange('token', e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Use @{'{store:key}'} syntax for secrets</p>
      </div>
    </div>
  );

  const renderFileForm = () => (
    <div className="space-y-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Output Files</Label>
        <Textarea 
          className="w-full font-mono"
          value={Array.isArray(nodeData.files) ? nodeData.files.join('\n') : "stdout"}
          onChange={(e) => handleDataChange('files', e.target.value.split('\n'))}
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">One file path per line</p>
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Rotation Interval</Label>
        <Input 
          className="w-full"
          value={nodeData.rotation_interval || "1d"}
          onChange={(e) => handleDataChange('rotation_interval', e.target.value)}
        />
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Data Format</Label>
        <Select 
          value={nodeData.data_format || "influx"} 
          onValueChange={(value) => handleDataChange('data_format', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="influx">InfluxDB Line Protocol</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render different forms based on plugin type
  const renderPluginForm = () => {
    switch (node.plugin) {
      case 'cpu':
        return renderCpuForm();
      case 'mem':
        return renderMemForm();
      case 'converter':
        return renderConverterForm();
      case 'influxdb_v2':
        return renderInfluxDbForm();
      case 'file':
        return renderFileForm();
      default:
        return (
          <div className="text-center text-gray-500 py-10">
            <p>No configuration available for this plugin</p>
          </div>
        );
    }
  };

  return (
    <form className="space-y-4" id="node-config">
      {renderPluginForm()}
      
      <div className="pt-4 border-t border-gray-200">
        <Button 
          variant="default"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleApplyChanges}
        >
          Apply Changes
        </Button>
      </div>
    </form>
  );
}
