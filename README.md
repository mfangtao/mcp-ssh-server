# SSH MCP Server

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.0.0-blue)](https://www.typescriptlang.org/)

一个基于SSH2和Model Context Protocol (MCP)的SSH服务器，提供远程命令执行功能。

## 功能特性

- 通过MCP协议提供SSH远程命令执行工具
- 支持密码和私钥认证
- 返回命令执行结果(stdout/stderr/exit code)
- 基于TypeScript开发，类型安全

## 安装

```bash
# 克隆仓库
git clone https://github.com/your-repo/ssh-server.git
cd ssh-server

# 安装依赖
npm install

# 构建项目
npm run build
```

## 使用方法

1. 启动服务器：
```bash
npm start
```

2. 通过MCP客户端调用`execute_ssh_command`工具：

请求示例：
```json
{
  "connection": {
    "host": "example.com",
    "port": 22,
    "username": "user",
    "password": "password"  // 或使用 privateKey
  },
  "command": "ls -la"
}
```

## 开发

```bash
# 开发模式
npm run build -- --watch

# 运行测试
# (需要添加测试脚本)
```

## 依赖

- [ssh2](https://github.com/mscdex/ssh2): SSH2客户端/服务器库
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk): MCP SDK

## 许可证

MIT