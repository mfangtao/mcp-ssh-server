"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = require("@modelcontextprotocol/sdk");
const ssh2_1 = require("ssh2");
class SSHServer {
    constructor() {
        this.server = new sdk_1.Server('ssh-server');
        this.sshClient = new ssh2_1.Client();
        this.registerTools();
    }
    registerTools() {
        this.server.registerTool('connect', {
            description: 'Connect to SSH server',
            parameters: {
                host: { type: 'string', required: true },
                port: { type: 'number', default: 22 },
                username: { type: 'string', required: true },
                privateKey: { type: 'string' },
                password: { type: 'string' }
            },
            execute: async (params) => {
                return new Promise((resolve, reject) => {
                    this.sshClient.on('ready', () => resolve({ connected: true }));
                    this.sshClient.on('error', (err) => reject(err));
                    this.sshClient.connect({
                        host: params.host,
                        port: params.port,
                        username: params.username,
                        privateKey: params.privateKey,
                        password: params.password
                    });
                });
            }
        });
        this.server.registerTool('execute', {
            description: 'Execute command on SSH server',
            parameters: {
                command: { type: 'string', required: true }
            },
            execute: async (params) => {
                return new Promise((resolve, reject) => {
                    this.sshClient.exec(params.command, (err, stream) => {
                        if (err)
                            return reject(err);
                        let stdout = '';
                        let stderr = '';
                        stream.on('data', (data) => stdout += data.toString())
                            .on('close', () => resolve({ stdout, stderr }))
                            .stderr.on('data', (data) => stderr += data.toString());
                    });
                });
            }
        });
        this.server.registerTool('disconnect', {
            description: 'Disconnect from SSH server',
            parameters: {},
            execute: async () => {
                this.sshClient.end();
                return { disconnected: true };
            }
        });
    }
    start() {
        this.server.start();
        console.log('SSH Server MCP plugin started');
    }
}
new SSHServer().start();
