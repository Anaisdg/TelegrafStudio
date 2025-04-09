import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the plugin types
export const PluginType = {
  INPUT: "input",
  PROCESSOR: "processor",
  AGGREGATOR: "aggregator",
  SERIALIZER: "serializer",
  OUTPUT: "output",
} as const;

export type PluginTypeValue = typeof PluginType[keyof typeof PluginType];

// Define the filter types
export const FilterType = {
  NAMEPASS: "namepass",
  NAMEDROP: "namedrop",
  FIELDPASS: "fieldpass",
  FIELDDROP: "fielddrop",
  TAGPASS: "tagpass",
  TAGDROP: "tagdrop",
} as const;

export type FilterTypeValue = typeof FilterType[keyof typeof FilterType];

// Define the Node schema
export const nodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    PluginType.INPUT, 
    PluginType.PROCESSOR, 
    PluginType.AGGREGATOR, 
    PluginType.SERIALIZER, 
    PluginType.OUTPUT
  ]),
  plugin: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  data: z.record(z.any()).optional()
});

// Define the Connection schema with filtering
export const connectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  filters: z.record(z.array(z.string())).optional()
});

// Define the Secret Store schema
export const secretStoreSchema = z.object({
  plugin: z.string(),
  config: z.record(z.any()),
  secrets: z.record(z.string()).optional()
});

// Define the Agent Configuration schema
export const agentConfigSchema = z.object({
  interval: z.string().default("10s"),
  round_interval: z.boolean().default(true),
  metric_batch_size: z.number().default(1000),
  metric_buffer_limit: z.number().default(10000),
  collection_jitter: z.string().default("0s"),
  flush_interval: z.string().default("10s"),
  flush_jitter: z.string().default("0s"),
  precision: z.string().default(""),
  debug: z.boolean().default(false),
  quiet: z.boolean().default(false),
  logtarget: z.string().default("file"),
  logfile: z.string().default(""),
  logfile_rotation_interval: z.string().default("0d"),
  logfile_rotation_max_size: z.string().default("0MB"),
  logfile_rotation_max_archives: z.number().default(5)
});

// Define the Telegraf Configuration schema
export const telegrafConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  agent: agentConfigSchema,
  nodes: z.array(nodeSchema),
  connections: z.array(connectionSchema),
  secretStore: secretStoreSchema.optional(),
  secretStores: z.array(secretStoreSchema).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Database table for telegraf configurations
export const telegrafConfigs = pgTable("telegraf_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  config: jsonb("config").notNull()
});

// Insert schema for database operations
export const insertTelegrafConfigSchema = createInsertSchema(telegrafConfigs).pick({
  name: true,
  config: true
});

// TypeScript types
export type Node = z.infer<typeof nodeSchema>;
export type Connection = z.infer<typeof connectionSchema>;
export type SecretStore = z.infer<typeof secretStoreSchema>;
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type TelegrafConfig = z.infer<typeof telegrafConfigSchema>;
export type InsertTelegrafConfig = z.infer<typeof insertTelegrafConfigSchema>;
export type TelegrafConfigRecord = typeof telegrafConfigs.$inferSelect;

// Available plugins for MVP
export const availablePlugins = {
  [PluginType.INPUT]: [
    { name: "cpu", description: "Collects CPU metrics", icon: "cpu-line" },
    { name: "mem", description: "Collects memory metrics", icon: "memory-line" }
  ],
  [PluginType.PROCESSOR]: [
    { name: "converter", description: "Converts data types", icon: "exchange-line" }
  ],
  [PluginType.AGGREGATOR]: [
    // Empty for MVP but structure is in place
  ],
  [PluginType.SERIALIZER]: [
    // Empty for MVP but structure is in place
  ],
  [PluginType.OUTPUT]: [
    { name: "influxdb_v2", description: "InfluxDB v2 output", icon: "database-2-line" },
    { name: "file", description: "Write to file", icon: "file-text-line" }
  ]
};

// Default configurations for plugins
export const defaultPluginConfigs = {
  cpu: {
    percpu: true,
    totalcpu: true,
    collect_cpu_time: false,
    report_active: false
  },
  mem: {
    // No specific configuration for mem
  },
  converter: {
    fields: {
      integer: ["usage_*"]
    }
  },
  influxdb_v2: {
    urls: ["http://localhost:8086"],
    token: "@{mystore:influx_token}",
    organization: "my-org",
    bucket: "telegraf"
  },
  file: {
    files: ["stdout", "/tmp/metrics.out"],
    rotation_interval: "1d",
    data_format: "influx"
  }
};
