const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

let currentProcess = null;
let logs = [];
let clients = [];

// POST /api/doc-generator/run - 启动文档生成程序
router.post('/run', (req, res) => {
  // 如果已有进程在运行，返回错误
  if (currentProcess) {
    return res.status(400).json({
      success: false,
      error: '文档生成程序正在运行中'
    });
  }

  // 清空之前的日志
  logs = [];

  const pythonScript = path.join(__dirname, '..', '..', '..', 'doc_generator', 'main.py');
  const workingDir = path.join(__dirname, '..', '..', '..');

  console.log(`Starting Python script: ${pythonScript}`);
  console.log(`Working directory: ${workingDir}`);

  // 启动 Python 进程
  currentProcess = spawn('python', [pythonScript], {
    cwd: workingDir,
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1'
    }
  });

  // 监听标准输出
  currentProcess.stdout.setEncoding('utf8');
  currentProcess.stdout.on('data', (data) => {
    const message = data.toString();
    const timestamp = new Date().toISOString();
    console.log(`[Python stdout]: ${message}`);

    const logEntry = { type: 'stdout', message, timestamp };
    logs.push(logEntry);

    // 广播给所有连接的客户端
    clients.forEach(client => {
      client.write(`data: ${JSON.stringify(logEntry)}\n\n`);
    });
  });

  // 监听标准错误
  currentProcess.stderr.setEncoding('utf8');
  currentProcess.stderr.on('data', (data) => {
    const message = data.toString();
    const timestamp = new Date().toISOString();
    console.error(`[Python stderr]: ${message}`);

    const logEntry = { type: 'stderr', message, timestamp };
    logs.push(logEntry);

    // 广播给所有连接的客户端
    clients.forEach(client => {
      client.write(`data: ${JSON.stringify(logEntry)}\n\n`);
    });
  });

  // 监听进程退出
  currentProcess.on('close', (code) => {
    const message = `进程退出，退出码: ${code}`;
    const timestamp = new Date().toISOString();
    console.log(message);

    const logEntry = { type: 'exit', message, code, timestamp };
    logs.push(logEntry);

    // 广播给所有连接的客户端
    clients.forEach(client => {
      client.write(`data: ${JSON.stringify(logEntry)}\n\n`);
    });

    currentProcess = null;
  });

  // 监听错误
  currentProcess.on('error', (error) => {
    const message = `启动进程失败: ${error.message}`;
    const timestamp = new Date().toISOString();
    console.error(message);

    const logEntry = { type: 'error', message, timestamp };
    logs.push(logEntry);

    // 广播给所有连接的客户端
    clients.forEach(client => {
      client.write(`data: ${JSON.stringify(logEntry)}\n\n`);
    });

    currentProcess = null;
  });

  res.json({
    success: true,
    message: '文档生成程序已启动'
  });
});

// GET /api/doc-generator/logs - SSE 日志流
router.get('/logs', (req, res) => {
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 发送历史日志
  logs.forEach(log => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  // 添加客户端到列表
  clients.push(res);

  // 客户端断开连接时移除
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// GET /api/doc-generator/status - 获取运行状态
router.get('/status', (req, res) => {
  res.json({
    success: true,
    running: !!currentProcess,
    logCount: logs.length
  });
});

// POST /api/doc-generator/stop - 停止运行
router.post('/stop', (req, res) => {
  if (!currentProcess) {
    return res.status(400).json({
      success: false,
      error: '没有正在运行的进程'
    });
  }

  currentProcess.kill();

  res.json({
    success: true,
    message: '已发送停止信号'
  });
});

module.exports = router;
