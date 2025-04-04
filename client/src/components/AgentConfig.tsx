import { useState, useEffect } from 'react';
import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import { AgentConfig as AgentConfigType } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AgentConfig() {
  const { telegrafConfig, setTelegrafConfig } = useTelegrafConfig();
  const [agentConfig, setAgentConfig] = useState<AgentConfigType>(telegrafConfig.agent);

  useEffect(() => {
    setAgentConfig(telegrafConfig.agent);
  }, [telegrafConfig.agent]);

  const handleChange = (key: keyof AgentConfigType, value: any) => {
    setAgentConfig({
      ...agentConfig,
      [key]: value,
    });
  };

  const handleSaveSettings = () => {
    setTelegrafConfig({
      ...telegrafConfig,
      agent: agentConfig,
    });
  };

  // Parse interval string to get value and unit
  const parseIntervalString = (intervalStr: string) => {
    const match = intervalStr.match(/^(\d+)([smh])$/);
    if (match) {
      return { value: match[1], unit: match[2] };
    }
    return { value: '10', unit: 's' };
  };

  const collectionInterval = parseIntervalString(agentConfig.interval);
  const flushInterval = parseIntervalString(agentConfig.flush_interval);

  return (
    <form className="space-y-4">
      <h3 className="font-medium">Agent Configuration</h3>
      <p className="text-sm text-gray-600 mb-4">Configure global Telegraf agent settings</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Collection Interval</Label>
          <div className="flex">
            <Input 
              type="text" 
              className="flex-1 border-l border-y border-gray-300 rounded-l-md shadow-sm py-2 px-3 text-sm" 
              value={collectionInterval.value}
              onChange={(e) => handleChange('interval', `${e.target.value}${collectionInterval.unit}`)}
            />
            <Select 
              value={collectionInterval.unit}
              onValueChange={(value) => handleChange('interval', `${collectionInterval.value}${value}`)}
            >
              <SelectTrigger className="border-r border-y border-gray-300 rounded-r-md shadow-sm py-2 px-2 text-sm bg-gray-50 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="s">seconds</SelectItem>
                <SelectItem value="m">minutes</SelectItem>
                <SelectItem value="h">hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Flush Interval</Label>
          <div className="flex">
            <Input 
              type="text" 
              className="flex-1 border-l border-y border-gray-300 rounded-l-md shadow-sm py-2 px-3 text-sm" 
              value={flushInterval.value}
              onChange={(e) => handleChange('flush_interval', `${e.target.value}${flushInterval.unit}`)}
            />
            <Select 
              value={flushInterval.unit}
              onValueChange={(value) => handleChange('flush_interval', `${flushInterval.value}${value}`)}
            >
              <SelectTrigger className="border-r border-y border-gray-300 rounded-r-md shadow-sm py-2 px-2 text-sm bg-gray-50 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="s">seconds</SelectItem>
                <SelectItem value="m">minutes</SelectItem>
                <SelectItem value="h">hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Metric Batch Size</Label>
          <Input 
            type="number" 
            className="w-full" 
            value={agentConfig.metric_batch_size}
            onChange={(e) => handleChange('metric_batch_size', parseInt(e.target.value))}
          />
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Buffer Limit</Label>
          <Input 
            type="number" 
            className="w-full" 
            value={agentConfig.metric_buffer_limit}
            onChange={(e) => handleChange('metric_buffer_limit', parseInt(e.target.value))}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="block text-sm font-medium text-gray-700">Options</Label>
        
        <div className="flex items-center">
          <Checkbox 
            id="round_interval" 
            checked={agentConfig.round_interval}
            onCheckedChange={(checked) => handleChange('round_interval', checked === true)}
            className="mr-2"
          />
          <Label htmlFor="round_interval" className="text-sm">Round collection interval</Label>
        </div>
        
        <div className="flex items-center">
          <Checkbox 
            id="debug" 
            checked={agentConfig.debug}
            onCheckedChange={(checked) => handleChange('debug', checked === true)}
            className="mr-2"
          />
          <Label htmlFor="debug" className="text-sm">Debug mode</Label>
        </div>
        
        <div className="flex items-center">
          <Checkbox 
            id="quiet" 
            checked={agentConfig.quiet}
            onCheckedChange={(checked) => handleChange('quiet', checked === true)}
            className="mr-2"
          />
          <Label htmlFor="quiet" className="text-sm">Quiet mode</Label>
        </div>
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Log Settings</Label>
        <div className="space-y-2">
          <Select 
            value={agentConfig.logtarget}
            onValueChange={(value) => handleChange('logtarget', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="file">File</SelectItem>
              <SelectItem value="stderr">stderr</SelectItem>
              <SelectItem value="stdout">stdout</SelectItem>
            </SelectContent>
          </Select>
          
          {agentConfig.logtarget === 'file' && (
            <Input 
              type="text" 
              className="w-full" 
              placeholder="Log file path"
              value={agentConfig.logfile}
              onChange={(e) => handleChange('logfile', e.target.value)}
            />
          )}
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <Button 
          type="button"
          variant="default"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleSaveSettings}
        >
          Save Agent Settings
        </Button>
      </div>
    </form>
  );
}
