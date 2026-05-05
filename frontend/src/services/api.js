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
  const response = await api.get('/trending', { params });
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

export default api;
