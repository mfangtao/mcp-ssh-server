declare module '@modelcontextprotocol/sdk' {
  interface ToolDefinition {
    description: string;
    parameters: Record<string, {
      type: string;
      required?: boolean;
      default?: any;
    }>;
    execute: (params: any) => Promise<any>;
  }

  class Server {
    constructor(name: string);
    registerTool(name: string, definition: ToolDefinition): void;
    start(): void;
  }
}

declare module 'ssh2' {
  import { EventEmitter } from 'events';
  
  interface ExecOptions {
    env?: Record<string, string>;
    pty?: boolean | object;
  }

  class Client extends EventEmitter {
    connect(config: {
      host: string;
      port?: number;
      username: string;
      privateKey?: string;
      password?: string;
    }): void;
    
    exec(command: string, callback: (err: Error, stream: any) => void): void;
    exec(command: string, options: ExecOptions, callback: (err: Error, stream: any) => void): void;
    
    end(): void;
    on(event: 'ready', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
  }
}