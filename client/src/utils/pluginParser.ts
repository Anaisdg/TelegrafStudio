/**
 * Plugin Configuration Parser
 * 
 * This module contains utilities for parsing Telegraf plugin configurations
 * from their README.md files on GitHub.
 */

/**
 * Types for plugin configuration and fields
 */
export interface PluginField {
  name: string;
  type: 'string' | 'array' | 'number' | 'boolean' | 'object';
  required: boolean;
  sensitive?: boolean;
  default: any;
  description: string;
  example?: string;
}

export interface PluginConfig {
  name: string;
  displayName: string;
  type: 'input' | 'processor' | 'output' | 'aggregator';
  description: string;
  fields: PluginField[];
}

/**
 * Fetches a plugin README.md from GitHub
 */
export async function fetchPluginReadme(pluginType: string, pluginName: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/influxdata/telegraf/master/plugins/${pluginType}s/${pluginName}/README.md`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch README: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching plugin README: ${error}`);
    throw error;
  }
}

/**
 * Extracts the configuration code block from a README.md
 */
export function extractConfigBlock(markdown: string): string | null {
  // Look for the configuration section
  const configSectionRegex = /## Configuration([\s\S]*?)```toml([\s\S]*?)```/;
  const match = markdown.match(configSectionRegex);
  
  if (match && match[2]) {
    return match[2].trim();
  }
  
  // Fallback: try to find any toml code block
  const fallbackRegex = /```toml([\s\S]*?)```/;
  const fallbackMatch = markdown.match(fallbackRegex);
  
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1].trim();
  }
  
  return null;
}

/**
 * Determines the type of a field based on its value
 */
function determineFieldType(value: string): PluginField['type'] {
  if (value.startsWith('[') && value.endsWith(']')) {
    return 'array';
  }
  
  if (value === 'true' || value === 'false') {
    return 'boolean';
  }
  
  if (value.startsWith('{') && value.endsWith('}')) {
    return 'object';
  }
  
  if (!isNaN(Number(value)) && value !== '') {
    return 'number';
  }
  
  return 'string';
}

/**
 * Parses raw field value from string format
 */
function parseFieldValue(type: PluginField['type'], value: string): any {
  if (value === '') return '';
  
  switch (type) {
    case 'array':
      try {
        // Attempt to parse JSON array, handling both forms: ["a", "b"] and [1, 2]
        return JSON.parse(value.replace(/(\w+)/g, '"$1"').replace(/""\w+""/g, (m) => m.replace(/^""|""$/g, '"')));
      } catch (e) {
        // Fallback to simple array with single string value
        return [value.replace(/\[|\]|"/g, '')];
      }
    case 'boolean':
      return value === 'true';
    case 'number':
      return Number(value);
    case 'object':
      try {
        return JSON.parse(value);
      } catch (e) {
        return {};
      }
    default:
      return value.replace(/^"|"$/g, ''); // Remove quotes if present
  }
}

/**
 * Parses a configuration block into structured field data
 */
export function parseConfigBlock(configBlock: string, pluginName: string, pluginType: string): PluginConfig {
  const lines = configBlock.split('\n');
  const fields: PluginField[] = [];
  
  let description = '';
  let currentField: Partial<PluginField> | null = null;
  let commentLines: string[] = [];
  
  // Get plugin description from the first commented line if possible
  if (lines[0].startsWith('#')) {
    description = lines[0].substring(1).trim().replace(/^#+\s*/g, '');
  }
  
  // First pass: collect comment blocks and field declarations
  const fieldComments: Record<string, string[]> = {};
  let lastCommentBlock: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      lastCommentBlock = [];
      continue;
    }
    
    // Check if this is a field line (contains =)
    const isFieldLine = /^\s*#?\s*[\w_]+ =/.test(line);
    
    if (isFieldLine) {
      // Extract field name
      const matches = line.match(/^\s*#?\s*([\w_]+)\s*=\s*(.*)$/);
      if (matches) {
        const fieldName = matches[1];
        // Store comments for this field
        fieldComments[fieldName] = [...lastCommentBlock];
        lastCommentBlock = [];
      }
    } else if (line.startsWith('#')) {
      // This is a comment line, store it
      // Remove any # characters and leading spaces
      const cleanedComment = line.substring(1).trim().replace(/^\s*#+\s*/, '');
      if (cleanedComment) {
        lastCommentBlock.push(cleanedComment);
      }
    } else {
      lastCommentBlock = [];
    }
  }
  
  // Second pass: parse fields with their descriptions
  lastCommentBlock = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if this is a field line (contains =)
    const isFieldLine = /^\s*#?\s*[\w_]+ =/.test(line);
    
    if (isFieldLine) {
      // If we were processing a field, add it to the list
      if (currentField && currentField.name) {
        // Get description from saved comments
        if (fieldComments[currentField.name] && fieldComments[currentField.name].length > 0) {
          // Join comments but filter out any remaining comment markers
          const cleanedComments = fieldComments[currentField.name]
            .map(comment => comment.replace(/^#+\s*/g, '').trim())
            .filter(comment => comment.length > 0);
          
          currentField.description = cleanedComments.join(' ');
        } else {
          currentField.description = '';
        }
        
        fields.push(currentField as PluginField);
      }
      
      // Start a new field
      const isRequired = !line.startsWith('#');
      
      // Extract field name and value
      const matches = line.match(/^\s*#?\s*([\w_]+)\s*=\s*(.*)$/);
      if (!matches) continue;
      
      const [_, name, rawValue] = matches;
      const strippedValue = rawValue.trim();
      const type = determineFieldType(strippedValue);
      const value = parseFieldValue(type, strippedValue);
      
      // Check if this field is sensitive (might contain credentials)
      const isSensitive = name.includes('token') || 
                         name.includes('key') || 
                         name.includes('password') || 
                         name.includes('secret');
      
      currentField = {
        name,
        type,
        required: isRequired,
        sensitive: isSensitive,
        default: value,
        description: '' // Will be filled later
      };
    }
  }
  
  // Add the last field if it exists
  if (currentField && currentField.name) {
    // Get description from saved comments
    if (fieldComments[currentField.name] && fieldComments[currentField.name].length > 0) {
      // Join comments but filter out any remaining comment markers
      const cleanedComments = fieldComments[currentField.name]
        .map(comment => comment.replace(/^#+\s*/g, '').trim())
        .filter(comment => comment.length > 0);
      
      currentField.description = cleanedComments.join(' ');
    }
    
    fields.push(currentField as PluginField);
  }
  
  // Create display name from plugin name (convert snake_case to Title Case)
  const displayName = pluginName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    name: pluginName,
    displayName,
    type: pluginType as any,
    description,
    fields
  };
}

/**
 * Main function to parse a plugin configuration
 */
export async function parsePluginConfig(pluginType: string, pluginName: string): Promise<PluginConfig> {
  try {
    const readme = await fetchPluginReadme(pluginType, pluginName);
    const configBlock = extractConfigBlock(readme);
    
    if (!configBlock) {
      throw new Error(`Could not find configuration block in README for ${pluginName}`);
    }
    
    return parseConfigBlock(configBlock, pluginName, pluginType);
  } catch (error) {
    console.error(`Error parsing plugin config: ${error}`);
    throw error;
  }
}

/**
 * Parses a TOML configuration string directly
 */
export function parseTomlConfig(tomlConfig: string, pluginName: string, pluginType: string): PluginConfig {
  return parseConfigBlock(tomlConfig, pluginName, pluginType);
}