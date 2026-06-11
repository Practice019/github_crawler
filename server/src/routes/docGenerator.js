const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 清理日志中的敏感信息
 * @param {String} message - 原始日志消息
 * @returns {String} - 清理后的日志
 */
function sanitizeLog(message) {
  return message
    .replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_***')
    .replace(/github_pat_[a-zA-Z0-9_]{82}/g, 'github_pat_***')
    .replace(/sk-[a-zA-Z0-9]{48,}/g, 'sk-***')
    .replace(/sk-proj-[a-zA-Z0-9_-]{100,}/g, 'sk-proj-***')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ***')
    .replace(/token["\s:=]+[a-zA-Z0-9._-]+/gi, 'token ***')
    .replace(/password["\s:=]+[^\s"]+/gi, 'password ***')
    .replace(/api[_-]?key["\s:=]+[^\s"]+/gi, 'api_key ***');
}

// 循环缓冲区类
class CircularBuffer {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.buffer = [];
  }

  push(item) {
    this.buffer.push(item);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getAll() {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
  }
}

// 进程管理器类
class ProcessManager {
  constructor() {
    this.currentProcess = null;
    this.logs = new CircularBuffer(1000);
    this.clients = new Set();
    this.maxClients = 100; // 最大连接数
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000); // 每30秒清理一次
  }

  cleanup() {
    // 清理已断开的客户端
    this.clients.forEach(client => {
      if (client.destroyed || client.writableEnded) {
        this.clients.delete(client);
      }
    });
  }

  isRunning() {
    return this.currentProcess !== null;
  }

  addLog(logEntry) {
    this.logs.push(logEntry);
    this.broadcast(logEntry);
  }

  broadcast(logEntry) {
    const data = `data: ${JSON.stringify(logEntry)}\n\n`;
    this.clients.forEach(client => {
      if (!client.destroyed && !client.writableEnded) {
        try {
          client.write(data);
        } catch (error) {
          console.error('Error broadcasting to client:', error.message);
          this.clients.delete(client);
        }
      }
    });
  }

  addClient(client) {
    // 检查连接数限制
    if (this.clients.size >= this.maxClients) {
      return false;
    }

    // 设置连接超时（5 分钟）
    client.setTimeout(300000);
    client.on('timeout', () => {
      client.end();
      this.clients.delete(client);
    });

    this.clients.add(client);
    return true;
  }

  removeClient(client) {
    this.clients.delete(client);
  }

  getLogs() {
    return this.logs.getAll();
  }

  clearLogs() {
    this.logs.clear();
  }

  setProcess(process) {
    this.currentProcess = process;
  }

  killProcess(signal = 'SIGTERM') {
    if (this.currentProcess) {
      this.currentProcess.kill(signal);
    }
  }

  clearProcess() {
    this.currentProcess = null;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clients.clear();
  }
}

// 创建单例进程管理器
const processManager = new ProcessManager();

// 验证 Python 脚本路径
function validatePythonScript() {
  const pythonScript = path.resolve(__dirname, '..', '..', '..', 'doc_generator', 'main.py');

  if (!fs.existsSync(pythonScript)) {
    throw new Error('Python 脚本不存在');
  }

  // 确保路径在预期目录内
  const expectedDir = path.resolve(__dirname, '..', '..', '..');
  if (!pythonScript.startsWith(expectedDir)) {
    throw new Error('Python 脚本路径无效');
  }

  return pythonScript;
}

// POST /api/doc-generator/run - 启动文档生成程序
router.post('/run', (req, res) => {
  // 如果已有进程在运行，返回错误
  if (processManager.isRunning()) {
    return res.status(400).json({
      success: false,
      error: '文档生成程序正在运行中'
    });
  }

  try {
    // 验证 Python 脚本
    const pythonScript = validatePythonScript();
    const workingDir = path.resolve(__dirname, '..', '..', '..');

    // 清空之前的日志
    processManager.clearLogs();

    console.log(`Starting Python script: ${pythonScript}`);
    console.log(`Working directory: ${workingDir}`);

    // 启动 Python 进程（限制环境变量，添加超时）
    const childProcess = spawn('python3.8', [pythonScript], {
      cwd: workingDir,
      env: {
        // 仅传递必要的环境变量
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1',
        LANG: process.env.LANG || 'en_US.UTF-8'
      },
      shell: false, // 禁用 shell
      timeout: 3600000 // 1 小时超时
    });

    processManager.setProcess(childProcess);

    // 添加执行超时保护
    const executionTimeout = setTimeout(() => {
      if (processManager.isRunning()) {
        console.warn('Process exceeded timeout, killing...');
        processManager.killProcess('SIGKILL');
        processManager.addLog({
          type: 'error',
          message: '进程超时（超过 1 小时），已被终止',
          timestamp: new Date().toISOString()
        });
      }
    }, 3600000); // 1 小时

    // 监听标准输出
    childProcess.stdout.setEncoding('utf8');
    childProcess.stdout.on('data', (data) => {
      const rawMessage = data.toString();
      const message = sanitizeLog(rawMessage);
      const timestamp = new Date().toISOString();
      console.log(`[Python stdout]: ${message}`);

      processManager.addLog({ type: 'stdout', message, timestamp });
    });

    // 监听标准错误
    childProcess.stderr.setEncoding('utf8');
    childProcess.stderr.on('data', (data) => {
      const rawMessage = data.toString();
      const message = sanitizeLog(rawMessage);
      const timestamp = new Date().toISOString();
      console.error(`[Python stderr]: ${message}`);

      processManager.addLog({ type: 'stderr', message, timestamp });
    });

    // 监听进程退出
    childProcess.on('close', (code) => {
      clearTimeout(executionTimeout); // 清理超时定时器
      const message = `进程退出，退出码: ${code}`;
      const timestamp = new Date().toISOString();
      console.log(message);

      processManager.addLog({ type: 'exit', message, code, timestamp });
      processManager.clearProcess();
    });

    // 监听错误
    childProcess.on('error', (error) => {
      clearTimeout(executionTimeout); // 清理超时定时器
      const message = `启动进程失败: ${error.message}`;
      const timestamp = new Date().toISOString();
      console.error(message);

      processManager.addLog({ type: 'error', message, timestamp });
      processManager.clearProcess();
    });

    res.json({
      success: true,
      message: '文档生成程序已启动'
    });
  } catch (error) {
    console.error('Failed to start process:', error);
    res.status(500).json({
      success: false,
      error: '启动失败'
    });
  }
});

// GET /api/doc-generator/logs - SSE 日志流
router.get('/logs', (req, res) => {
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // 检查连接数限制
  if (!processManager.addClient(res)) {
    return res.status(429).json({
      success: false,
      error: '连接数过多，请稍后再试'
    });
  }

  // 发送历史日志
  const logs = processManager.getLogs();
  logs.forEach(log => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  // 客户端断开连接时移除
  req.on('close', () => {
    processManager.removeClient(res);
  });
});

// GET /api/doc-generator/status - 获取运行状态
router.get('/status', (req, res) => {
  res.json({
    success: true,
    running: processManager.isRunning(),
    logCount: processManager.getLogs().length
  });
});

// POST /api/doc-generator/stop - 停止运行
router.post('/stop', (req, res) => {
  if (!processManager.isRunning()) {
    return res.status(400).json({
      success: false,
      error: '没有正在运行的进程'
    });
  }

  // 先发送 SIGTERM
  processManager.killProcess('SIGTERM');

  // 5秒后如果还在运行，发送 SIGKILL
  setTimeout(() => {
    if (processManager.isRunning()) {
      console.log('Process did not respond to SIGTERM, sending SIGKILL');
      processManager.killProcess('SIGKILL');
    }
  }, 5000);

  res.json({
    success: true,
    message: '已发送停止信号'
  });
});

module.exports = router;
