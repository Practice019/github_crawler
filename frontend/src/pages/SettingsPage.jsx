import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SettingsPage.css';

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showAdminToken, setShowAdminToken] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [config, setConfig] = useState({
    apiBase: '',
    apiKey: '',
    model: '',
    githubToken: ''
  });
  const [originalConfig, setOriginalConfig] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 不要在 useEffect 中自动加载配置

  const loadConfig = async () => {
    if (!adminToken) {
      showMessage('error', '请先输入管理员令牌');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('/api/settings/doc-generator', {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (response.data.success) {
        const data = response.data.config;
        setConfig(data);
        setOriginalConfig(data);
        setIsAuthenticated(true);
        showMessage('success', '配置加载成功');
      } else {
        showMessage('error', '加载配置失败');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        showMessage('error', '认证失败，请检查管理员令牌');
      } else {
        showMessage('error', '加载配置失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // 验证必填项
    if (!adminToken) {
      showMessage('error', '请先输入管理员令牌');
      return;
    }

    if (!config.apiBase.trim()) {
      showMessage('error', '请输入 API 请求地址');
      return;
    }

    if (!config.apiKey.trim()) {
      showMessage('error', '请输入 API Key');
      return;
    }

    if (!config.model.trim()) {
      showMessage('error', '请输入模型名称');
      return;
    }

    if (!config.githubToken.trim()) {
      showMessage('error', '请输入 GitHub Token');
      return;
    }

    try {
      setSaving(true);
      const response = await axios.post('/api/settings/doc-generator', {
        ...config,
        protocol: 'openai' // 固定使用 OpenAI 协议
      }, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (response.data.success) {
        setOriginalConfig(config);
        showMessage('success', '保存成功！配置已更新');
      } else {
        showMessage('error', response.data.error || '保存失败');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        showMessage('error', '认证失败，请检查管理员令牌');
      } else {
        showMessage('error', `保存失败: ${error.response?.data?.error || '网络错误'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setConfig({ ...originalConfig });
      showMessage('info', '已恢复到上次保存的配置');
    }
  };

  const handleTestConnection = async () => {
    if (!adminToken) {
      showMessage('error', '请先输入管理员令牌');
      return;
    }

    if (!config.apiBase.trim() || !config.apiKey.trim()) {
      showMessage('error', '请先填写 API 地址和 Key');
      return;
    }

    try {
      setSaving(true);
      showMessage('info', '正在测试连接...');

      const response = await axios.post('/api/settings/test-connection', {
        apiBase: config.apiBase,
        apiKey: config.apiKey,
        model: config.model,
        protocol: 'openai' // 固定使用 OpenAI 协议
      }, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (response.data.success) {
        showMessage('success', '连接测试成功！API 配置正常');
      } else {
        showMessage('error', `连接测试失败: ${response.data.error}`);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        showMessage('error', '认证失败，请检查管理员令牌');
      } else {
        showMessage('error', `连接测试失败: ${error.response?.data?.error || '网络错误'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  const hasChanges = () => {
    if (!originalConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载配置中...</p>
        </div>
      </div>
    );
  }

  // 未认证时显示认证界面
  if (!isAuthenticated) {
    return (
      <div className="settings-page">
        <div className="auth-container">
          <div className="auth-box">
            <h2>🔒 管理员认证</h2>
            <p>此页面需要管理员权限访问</p>

            {message.text && (
              <div className={`message message-${message.type}`}>
                {message.type === 'success' && '✅ '}
                {message.type === 'error' && '❌ '}
                {message.type === 'info' && 'ℹ️ '}
                {message.text}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="adminToken">管理员令牌</label>
              <div className="password-input-wrapper">
                <input
                  id="adminToken"
                  type={showAdminToken ? 'text' : 'password'}
                  className="form-input"
                  placeholder="请输入管理员令牌"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadConfig();
                    }
                  }}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowAdminToken(!showAdminToken)}
                >
                  {showAdminToken ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="form-hint">
                令牌位于服务器 .env 文件的 ADMIN_TOKEN 变量中
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={loadConfig}
              disabled={!adminToken}
            >
              验证并加载配置
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>⚙️ 文档生成器设置</h2>
        <p className="settings-description">
          配置 AI API 参数，用于生成项目介绍文档
        </p>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.type === 'success' && '✅ '}
          {message.type === 'error' && '❌ '}
          {message.type === 'info' && 'ℹ️ '}
          {message.text}
        </div>
      )}

      <div className="settings-content">
        <div className="settings-section">
          <h3>API 配置</h3>

          <div className="form-group">
            <label htmlFor="apiBase">
              API 请求地址 <span className="required">*</span>
            </label>
            <input
              id="apiBase"
              type="text"
              className="form-input"
              placeholder="例如: https://api.openai.com/v1 或 http://your-api.com/v1"
              value={config.apiBase}
              onChange={(e) => setConfig({ ...config, apiBase: e.target.value })}
            />
            <p className="form-hint">
              API 的基础地址，通常以 /v1 结尾
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="apiKey">
              API Key <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                className="form-input"
                placeholder="sk-..."
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? '隐藏' : '显示'}
              >
                {showApiKey ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <p className="form-hint">
              API 密钥，保密信息，请妥善保管
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="model">
              模型名称 <span className="required">*</span>
            </label>
            <input
              id="model"
              type="text"
              className="form-input"
              placeholder="例如: claude-haiku-4-5-20251001 或 gpt-4"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
            />
            <p className="form-hint">
              使用的 AI 模型名称，请参考服务商文档
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="githubToken">
              GitHub Token <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="githubToken"
                type={showGithubToken ? 'text' : 'password'}
                className="form-input"
                placeholder="github_pat_..."
                value={config.githubToken}
                onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowGithubToken(!showGithubToken)}
                title={showGithubToken ? '隐藏' : '显示'}
              >
                {showGithubToken ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <p className="form-hint">
              用于下载 GitHub README 文件，获取方式：
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', marginLeft: '4px'}}>
                GitHub Settings → Tokens
              </a>
              （需要 public_repo 权限）
            </p>
          </div>
        </div>

        <div className="settings-actions">
          <button
            className="btn btn-test"
            onClick={handleTestConnection}
            disabled={saving}
          >
            🔌 测试连接
          </button>
          <div className="actions-right">
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={saving || !hasChanges()}
            >
              重置
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !hasChanges()}
            >
              {saving ? '保存中...' : '💾 保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
