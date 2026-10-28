import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('toxiwatch_token') || localStorage.getItem('sentinel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('toxiwatch_token');
      localStorage.removeItem('toxiwatch_user');
      localStorage.removeItem('sentinel_token');
      localStorage.removeItem('sentinel_user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
};

export const postsAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  getPostDetail: (id) => api.get(`/posts/${id}`),
  exportCsvUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `/api/posts/export/csv?${query}`;
  },
};

export const predictAPI = {
  predict: (comment, context, threshold = 0.55) =>
    api.post('/predict', { comment, conversation_context: context, confidence_threshold: threshold }),
};

export const modelsAPI = {
  getMetrics: () => api.get('/models/metrics'),
  triggerRetrain: () => api.post('/models/retrain'),
};

export const trendsAPI = {
  getTrends: (windowMinutes = 60) => api.get(`/trends?window_minutes=${windowMinutes}`),
  getAlerts: (status) => api.get('/trends/alerts', { params: { status } }),
  updateAlertStatus: (id, status) => api.post(`/trends/alerts/${id}/status`, { status }),
};

export const reviewsAPI = {
  getQueue: (params) => api.get('/reviews/queue', { params }),
  submitDecision: (postId, data) => api.post(`/reviews/${postId}`, data),
};

export const auditAPI = {
  getLogs: (limit = 50) => api.get('/audit/logs', { params: { limit } }),
};

export default api;
