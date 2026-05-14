import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
});

export const getTrendingProjects = async (params = {}) => {
  const response = await api.get('/trending', { params });
  return response.data;
};

export const getTrendingByLanguage = async (language, params = {}) => {
  const response = await api.get(`/trending/${language}`, { params });
  return response.data;
};

export const getTrendingWithIntros = async (params = {}) => {
  // 移除空的 language 参数
  const cleanParams = { ...params };
  if (!cleanParams.language) {
    delete cleanParams.language;
  }
  const response = await api.get('/github/trending', { params: cleanParams });
  return response.data;
};

export const getProjectIntro = async (owner, repo) => {
  const response = await api.get(`/intro/${owner}/${repo}`);
  return response.data;
};

export const analyzeRepo = async (owner, repo) => {
  const response = await api.get(`/analyze/${owner}/${repo}`);
  return response.data;
};

export const getBatchIntros = async (repos) => {
  const response = await api.post('/intros/batch', { repos });
  return response.data;
};

// 项目介绍相关接口
export const getIntroductions = async () => {
  const response = await api.get('/introductions');
  return response.data;
};

export const getIntroductionDetail = async (id) => {
  const response = await api.get(`/introductions/${id}`);
  return response.data;
};

export default api;
