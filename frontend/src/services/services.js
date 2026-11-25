
import api from './api';

export const authService = {
  register: d => api.post('/auth/register', d).then(r => r.data),
  login: d => api.post('/auth/login', d).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data)
};

export const projectService = {
  list: () => api.get('/projects').then(r => r.data),
  create: d => api.post('/projects', d).then(r => r.data),
  get: id => api.get(`/projects/${id}`).then(r => r.data),
  createRoom: (id, d) =>
    api.post(`/projects/${id}/rooms`, d).then(r => r.data)
};

export const catalogueService = {
  list: search =>
    api.get('/catalogue', { params: { search } }).then(r => r.data),

  create: d =>
    api.post('/catalogue', d).then(r => r.data),

  adjustStock: (id, d) =>
    api.patch(`/catalogue/${id}/stock`, d).then(r => r.data),

  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);

    return api.post(`/catalogue/${id}/image`, formData)
      .then(r => r.data);
  }
};

export const designService = {
  save: d => api.post('/designs', d).then(r => r.data),
  list: id => api.get(`/designs/${id}`).then(r => r.data),
  estimate: items =>
    api.post('/estimates', { items }).then(r => r.data)
};

export const quoteService = {
  list: () => api.get('/quotations').then(r => r.data),
  create: d => api.post('/quotations', d).then(r => r.data),
  status: (id, status) =>
    api.patch(`/quotations/${id}/status`, { status }).then(r => r.data),
  pdfUrl: id => `${api.defaults.baseURL}/quotations/${id}/pdf`
};

export const orderService = {
  list: () => api.get('/orders').then(r => r.data),
  create: d => api.post('/orders', d).then(r => r.data),
  status: (id, status) =>
    api.patch(`/orders/${id}/status`, { status }).then(r => r.data)
};

export const reportService = {
  summary: () => api.get('/reports/summary').then(r => r.data)
};

export const enquiryService = {
  create: d => api.post('/enquiries', d).then(r => r.data)
};
