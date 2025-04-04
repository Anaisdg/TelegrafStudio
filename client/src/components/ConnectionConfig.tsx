import { useState, useEffect } from 'react';
import { useTelegrafConfig } from '@/hooks/TelegrafContext';
import { Connection, FilterType } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ConnectionConfigProps {
  connection: Connection;
}

export default function ConnectionConfig({ connection }: ConnectionConfigProps) {
  const { telegrafConfig, setTelegrafConfig } = useTelegrafConfig();
  const [filters, setFilters] = useState<Record<string, string[]>>(connection.filters || {});
  const [filterType, setFilterType] = useState<string>(
    Object.keys(connection.filters || {}).includes('namepass') 
      ? 'namepass' 
      : Object.keys(connection.filters || {}).includes('namedrop')
        ? 'namedrop'
        : 'namepass'
  );
  const [enableFieldFilters, setEnableFieldFilters] = useState<boolean>(
    Object.keys(connection.filters || {}).includes('fieldpass') || 
    Object.keys(connection.filters || {}).includes('fielddrop')
  );
  const [fieldFilterType, setFieldFilterType] = useState<string>(
    Object.keys(connection.filters || {}).includes('fieldpass') 
      ? 'fieldpass' 
      : 'fielddrop'
  );
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    connection.filters?.namepass || connection.filters?.namedrop || []
  );
  const [selectedFields, setSelectedFields] = useState<string[]>(
    connection.filters?.fieldpass || connection.filters?.fielddrop || []
  );
  const [tagKey, setTagKey] = useState<string>('');
  const [tagFilterType, setTagFilterType] = useState<string>('tagdrop');
  const [tagValue, setTagValue] = useState<string>('');

  // Update local state when connection changes
  useEffect(() => {
    setFilters(connection.filters || {});
    setFilterType(
      Object.keys(connection.filters || {}).includes('namepass') 
        ? 'namepass' 
        : Object.keys(connection.filters || {}).includes('namedrop')
          ? 'namedrop'
          : 'namepass'
    );
    setEnableFieldFilters(
      Object.keys(connection.filters || {}).includes('fieldpass') || 
      Object.keys(connection.filters || {}).includes('fielddrop')
    );
    setFieldFilterType(
      Object.keys(connection.filters || {}).includes('fieldpass') 
        ? 'fieldpass' 
        : 'fielddrop'
    );
    setSelectedMetrics(
      connection.filters?.namepass || connection.filters?.namedrop || []
    );
    setSelectedFields(
      connection.filters?.fieldpass || connection.filters?.fielddrop || []
    );
  }, [connection]);

  const handleApplyFilters = () => {
    // Build the filters object
    const newFilters: Record<string, string[]> = {};
    
    // Add metric filters
    newFilters[filterType] = selectedMetrics;
    
    // Add field filters if enabled
    if (enableFieldFilters && selectedFields.length > 0) {
      newFilters[fieldFilterType] = selectedFields;
    }
    
    // Add tag filters if provided
    if (tagKey && tagValue) {
      if (!newFilters[tagFilterType]) {
        newFilters[tagFilterType] = [];
      }
      newFilters[tagFilterType].push(`${tagKey}:${tagValue}`);
    }
    
    // Update the connection in the telegraf config
    const updatedConnections = telegrafConfig.connections.map((conn) => {
      if (conn.id === connection.id) {
        return {
          ...conn,
          filters: newFilters,
        };
      }
      return conn;
    });
    
    setTelegrafConfig({
      ...telegrafConfig,
      connections: updatedConnections,
    });
  };

  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter((f) => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  // Example metrics and fields for demo purposes
  const availableMetrics = ['cpu', 'system', 'disk', 'mem'];
  const availableFields = ['usage_user', 'usage_system', 'usage_idle', 'usage_nice', 'usage_iowait'];

  return (
    <form className="space-y-4" id="connection-config">
      <h3 className="font-medium">Filter Configuration</h3>
      <p className="text-sm text-gray-600 mb-4">Configure what data passes through this connection</p>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Metric Filter</Label>
        <RadioGroup value={filterType} onValueChange={setFilterType} className="mb-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="namepass" id="namepass" />
            <Label htmlFor="namepass" className="text-sm">Include metrics (namepass)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="namedrop" id="namedrop" />
            <Label htmlFor="namedrop" className="text-sm">Exclude metrics (namedrop)</Label>
          </div>
        </RadioGroup>
        
        <div className="border border-gray-300 rounded-md p-2 max-h-24 overflow-y-auto">
          {availableMetrics.map((metric) => (
            <div key={metric} className="flex items-center space-x-2 py-1">
              <input 
                type="checkbox" 
                id={`metric-${metric}`} 
                className="rounded"
                checked={selectedMetrics.includes(metric)}
                onChange={() => toggleMetric(metric)}
              />
              <Label htmlFor={`metric-${metric}`} className="text-sm">{metric}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="block text-sm font-medium text-gray-700">Field Filter</Label>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="enable-field-filters" 
              className="rounded mr-2"
              checked={enableFieldFilters}
              onChange={(e) => setEnableFieldFilters(e.target.checked)}
            />
            <Label htmlFor="enable-field-filters" className="text-sm">Enable field filters</Label>
          </div>
        </div>
        
        {enableFieldFilters && (
          <>
            <RadioGroup value={fieldFilterType} onValueChange={setFieldFilterType} className="mb-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fieldpass" id="fieldpass" />
                <Label htmlFor="fieldpass" className="text-sm">Include fields (fieldpass)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fielddrop" id="fielddrop" />
                <Label htmlFor="fielddrop" className="text-sm">Exclude fields (fielddrop)</Label>
              </div>
            </RadioGroup>
            
            <div className="border border-gray-300 rounded-md p-2 max-h-24 overflow-y-auto">
              {availableFields.map((field) => (
                <div key={field} className="flex items-center space-x-2 py-1">
                  <input 
                    type="checkbox" 
                    id={`field-${field}`} 
                    className="rounded"
                    checked={selectedFields.includes(field)}
                    onChange={() => toggleField(field)}
                  />
                  <Label htmlFor={`field-${field}`} className="text-sm">{field}</Label>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Tag Filter</Label>
        <div className="mb-1 flex justify-between items-center">
          <span className="text-xs text-gray-500">Filter measurements based on tag values</span>
        </div>
        <div className="space-y-2">
          <div className="flex space-x-2">
            <select 
              className="border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm flex-1"
              value={tagKey}
              onChange={(e) => setTagKey(e.target.value)}
            >
              <option value="">Select tag</option>
              <option value="cpu">cpu</option>
              <option value="host">host</option>
            </select>
            <select 
              className="border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm flex-1"
              value={tagFilterType}
              onChange={(e) => setTagFilterType(e.target.value)}
            >
              <option value="tagdrop">tagdrop</option>
              <option value="tagpass">tagpass</option>
            </select>
          </div>
          <Input 
            type="text" 
            className="w-full" 
            placeholder="Value or regex"
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="text-xs bg-gray-200 hover:bg-gray-300"
          >
            + Add Tag Filter
          </Button>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <Button 
          type="button"
          variant="default"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleApplyFilters}
        >
          Apply Filters
        </Button>
      </div>
    </form>
  );
}
