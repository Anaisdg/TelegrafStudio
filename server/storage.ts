import { TelegrafConfig, TelegrafConfigRecord, InsertTelegrafConfig } from "@shared/schema";

// Define the interface for storage operations
export interface IStorage {
  getTelegrafConfigs(): Promise<TelegrafConfigRecord[]>;
  getTelegrafConfig(id: number): Promise<TelegrafConfigRecord | undefined>;
  createTelegrafConfig(config: InsertTelegrafConfig): Promise<TelegrafConfigRecord>;
  updateTelegrafConfig(id: number, config: Partial<InsertTelegrafConfig>): Promise<TelegrafConfigRecord | undefined>;
  deleteTelegrafConfig(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private telegrafConfigs: Map<number, TelegrafConfigRecord>;
  private currentId: number;

  constructor() {
    this.telegrafConfigs = new Map();
    this.currentId = 1;
    
    // Add a default configuration
    const defaultConfig: TelegrafConfig = {
      id: "default",
      name: "cpu_mem_collection",
      agent: {
        interval: "10s",
        round_interval: true,
        metric_batch_size: 1000,
        metric_buffer_limit: 10000,
        collection_jitter: "0s",
        flush_interval: "10s",
        flush_jitter: "0s",
        precision: "",
        debug: false,
        quiet: false,
        logtarget: "file",
        logfile: "",
        logfile_rotation_interval: "0d",
        logfile_rotation_max_size: "0MB",
        logfile_rotation_max_archives: 5
      },
      nodes: [
        {
          id: "cpu1",
          type: "input",
          plugin: "cpu",
          position: { x: 100, y: 100 },
          data: {
            percpu: true,
            totalcpu: true,
            collect_cpu_time: false,
            report_active: false
          }
        },
        {
          id: "conv1",
          type: "processor",
          plugin: "converter",
          position: { x: 350, y: 100 },
          data: {
            fields: {
              integer: ["usage_*"]
            }
          }
        },
        {
          id: "influxdb1",
          type: "output",
          plugin: "influxdb_v2",
          position: { x: 600, y: 100 },
          data: {
            urls: ["http://localhost:8086"],
            token: "@{mystore:influx_token}",
            organization: "my-org",
            bucket: "telegraf"
          }
        },
        {
          id: "mem1",
          type: "input",
          plugin: "mem",
          position: { x: 100, y: 250 },
          data: {}
        },
        {
          id: "file1",
          type: "output",
          plugin: "file",
          position: { x: 600, y: 250 },
          data: {
            files: ["stdout", "/tmp/metrics.out"],
            rotation_interval: "1d",
            data_format: "influx"
          }
        }
      ],
      connections: [
        {
          id: "cpu1-conv1",
          source: "cpu1",
          target: "conv1",
          filters: { namepass: ["cpu"] }
        },
        {
          id: "conv1-influxdb1",
          source: "conv1",
          target: "influxdb1",
          filters: {}
        },
        {
          id: "mem1-file1",
          source: "mem1",
          target: "file1",
          filters: { namepass: ["mem"] }
        }
      ],
      secretStores: [
        {
          id: "mystore",
          type: "os",
          data: {}
        }
      ]
    };
    
    const record: TelegrafConfigRecord = {
      id: this.currentId++,
      name: defaultConfig.name,
      config: defaultConfig
    };
    
    this.telegrafConfigs.set(record.id, record);
  }

  async getTelegrafConfigs(): Promise<TelegrafConfigRecord[]> {
    return Array.from(this.telegrafConfigs.values());
  }

  async getTelegrafConfig(id: number): Promise<TelegrafConfigRecord | undefined> {
    return this.telegrafConfigs.get(id);
  }

  async createTelegrafConfig(insertConfig: InsertTelegrafConfig): Promise<TelegrafConfigRecord> {
    const id = this.currentId++;
    const record: TelegrafConfigRecord = {
      id,
      ...insertConfig
    };
    this.telegrafConfigs.set(id, record);
    return record;
  }

  async updateTelegrafConfig(
    id: number,
    updates: Partial<InsertTelegrafConfig>
  ): Promise<TelegrafConfigRecord | undefined> {
    const existingConfig = this.telegrafConfigs.get(id);
    
    if (!existingConfig) {
      return undefined;
    }
    
    const updatedConfig: TelegrafConfigRecord = {
      ...existingConfig,
      ...updates
    };
    
    this.telegrafConfigs.set(id, updatedConfig);
    return updatedConfig;
  }

  async deleteTelegrafConfig(id: number): Promise<boolean> {
    return this.telegrafConfigs.delete(id);
  }
}

export const storage = new MemStorage();
