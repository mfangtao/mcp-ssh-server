#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from 'ssh2';

interface SSHConnectionConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
}

interface SSHCommandResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

class SSHServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'ssh-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.server.onerror = (error) => console.error('[SSH Server Error]', error);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_ssh_command',
          description: 'Execute command on remote server via SSH',
          inputSchema: {
            type: 'object',
            properties: {
              connection: {
                type: 'object',
                properties: {
                  host: { type: 'string' },
                  port: { type: 'number', default: 22 },
                  username: { type: 'string' },
                  password: { type: 'string' },
                  privateKey: { type: 'string' },
                },
                required: ['host', 'username'],
              },
              command: { type: 'string' },
            },
            required: ['connection', 'command'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'execute_ssh_command') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      if (!request.params.arguments) {
        throw new McpError(ErrorCode.InvalidParams, 'Missing arguments');
      }
      
      const { connection, command } = request.params.arguments as {
        connection: SSHConnectionConfig;
        command: string;
      };
      
      if (!connection || !command) {
        throw new McpError(ErrorCode.InvalidParams, 'Missing connection or command');
      }
      
      const result = await this.executeSSHCommand(connection, command);

      if (result.code !== 0) {
        return {
          content: [
            {
              type: 'text',
              text: `Command failed with code ${result.code}\nSTDERR: ${result.stderr}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: result.stdout,
          },
        ],
      };
    });
  }

  private executeSSHCommand(
    config: SSHConnectionConfig,
    command: string
  ): Promise<SSHCommandResult> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let stdout = '';
      let stderr = '';
      let code: number | null = null;

      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }

          stream
            .on('close', (exitCode: number) => {
              code = exitCode;
              conn.end();
              resolve({ stdout, stderr, code });
            })
            .on('data', (data: string) => {
              stdout += data;
            })
            .stderr.on('data', (data: string) => {
              stderr += data;
            });
        });
      }).on('error', (err) => {
        reject(err);
      });

      const connectOptions: any = {
        host: config.host,
        port: config.port || 22,
        username: config.username,
      };

      if (config.password) {
        connectOptions.password = config.password;
      } else if (config.privateKey) {
        connectOptions.privateKey = config.privateKey;
      }

      conn.connect(connectOptions);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SSH MCP server running on stdio');
  }
}

const server = new SSHServer();
server.run().catch(console.error);