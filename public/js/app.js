const API_BASE = '/api';

const state = {
  repos: [],
  language: 'all',
  since: 'daily',
  loading: false,
};

const DOM = {
  languageSelect: document.getElementById('languageSelect'),
  sinceSelect: document.getElementById('sinceSelect'),
  refreshBtn: document.getElementById('refreshBtn'),
  loading: document.getElementById('loading'),
  stats: document.getElementById('stats'),
  lastUpdated: document.getElementById('lastUpdated'),
  repoCount: document.getElementById('repoCount'),
  repoList: document.getElementById('repoList'),
  modal: document.getElementById('modal'),
  modalBody: document.getElementById('modalBody'),
  closeModal: document.getElementById('closeModal'),
};

const langColors = {
  JavaScript: 'lang-javascript',
  TypeScript: 'lang-typescript',
  Python: 'lang-python',
  Go: 'lang-go',
  Rust: 'lang-rust',
  Java: 'lang-java',
  'C++': 'lang-c++',
  Vue: 'lang-vue',
};

async function fetchLanguages() {
  try {
    const res = await fetch(`${API_BASE}/languages`);
    const data = await res.json();
    if (data.success) {
      data.data.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang === 'all' ? '全部语言' : lang.charAt(0).toUpperCase() + lang.slice(1);
        DOM.languageSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Failed to fetch languages:', err);
  }
}

async function fetchRepos() {
  if (state.loading) return;

  state.loading = true;
  DOM.loading.classList.remove('hidden');
  DOM.repoList.innerHTML = '';
  DOM.stats.classList.add('hidden');

  try {
    const url = `${API_BASE}/trending?language=${state.language}&since=${state.since}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      state.repos = data.data;
      renderStats(data);
      renderRepos(state.repos);
    } else {
      DOM.repoList.innerHTML = '<p class="error">加载失败: ' + data.error + '</p>';
    }
  } catch (err) {
    DOM.repoList.innerHTML = '<p class="error">网络错误: ' + err.message + '</p>';
  } finally {
    state.loading = false;
    DOM.loading.classList.add('hidden');
  }
}

function renderStats(data) {
  DOM.stats.classList.remove('hidden');
  const now = new Date();
  DOM.lastUpdated.textContent = `更新于: ${now.toLocaleString('zh-CN')}`;
  DOM.repoCount.textContent = `共 ${data.count} 个项目`;
}

function renderRepos(repos) {
  if (repos.length === 0) {
    DOM.repoList.innerHTML = '<p class="empty">暂无数据</p>';
    return;
  }

  DOM.repoList.innerHTML = repos.map((repo, index) => `
    <div class="repo-card" data-index="${index}">
      <div class="repo-header">
        <div class="repo-title">
          <span class="repo-rank">#${index + 1}</span>
          <a href="${repo.url}" target="_blank" rel="noopener">${repo.author}/${repo.name}</a>
        </div>
      </div>
      <p class="repo-description">${escapeHtml(repo.description)}</p>
      <div class="repo-meta">
        ${repo.language !== 'Unknown' ? `
          <span class="meta-item">
            <span class="lang-dot ${langColors[repo.language] || ''}"></span>
            ${repo.language}
          </span>
        ` : ''}
        <span class="meta-item">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
          ${formatNumber(repo.stars)}
        </span>
        <span class="meta-item">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.5 2.5 0 11-5 0z"/></svg>
          ${formatNumber(repo.forks)}
        </span>
        ${repo.todayStars > 0 ? `<span class="meta-item today-stars">+${formatNumber(repo.todayStars)} 今日</span>` : ''}
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.repo-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') return;
      const index = parseInt(card.dataset.index);
      showModal(state.repos[index]);
    });
  });
}

function showModal(repo) {
  DOM.modalBody.innerHTML = `
    <div class="modal-header">
      <h2>${repo.author} / ${repo.name}</h2>
      <p style="color: var(--text-secondary)">${repo.description}</p>
    </div>
    <div class="modal-intro">
      <p>${escapeHtml(repo.intro)}</p>
    </div>
    <div class="modal-stats">
      <div class="modal-stat">
        <div class="modal-stat-value">${formatNumber(repo.stars)}</div>
        <div class="modal-stat-label">Stars</div>
      </div>
      <div class="modal-stat">
        <div class="modal-stat-value">${formatNumber(repo.forks)}</div>
        <div class="modal-stat-label">Forks</div>
      </div>
      ${repo.todayStars > 0 ? `
        <div class="modal-stat">
          <div class="modal-stat-value" style="color: var(--warning)">+${formatNumber(repo.todayStars)}</div>
          <div class="modal-stat-label">今日新增</div>
        </div>
      ` : ''}
      ${repo.language !== 'Unknown' ? `
        <div class="modal-stat">
          <div class="modal-stat-value"><span class="lang-dot ${langColors[repo.language] || ''}"></span></div>
          <div class="modal-stat-label">${repo.language}</div>
        </div>
      ` : ''}
    </div>
    <a href="${repo.url}" target="_blank" rel="noopener" class="modal-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
      在 GitHub 上查看
    </a>
  `;
  DOM.modal.classList.remove('hidden');
}

function hideModal() {
  DOM.modal.classList.add('hidden');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatNumber(num) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

DOM.languageSelect.addEventListener('change', (e) => {
  state.language = e.target.value;
  fetchRepos();
});

DOM.sinceSelect.addEventListener('change', (e) => {
  state.since = e.target.value;
  fetchRepos();
});

DOM.refreshBtn.addEventListener('click', () => {
  fetchRepos();
});

DOM.closeModal.addEventListener('click', hideModal);

DOM.modal.addEventListener('click', (e) => {
  if (e.target === DOM.modal) hideModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideModal();
});

fetchLanguages();
fetchRepos();
