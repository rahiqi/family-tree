const API_BASE_URL = 'https://api.treely.ir/api'; // Standard port for ASP.NET Web API
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

// Helper to get token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Generic request wrapper
async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  // If it's FormData, let the browser set the Content-Type automatically (including boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
    throw new Error('Unauthorized');
  }

  if (response.status === 403) {
    throw new Error('Forbidden: You do not have permission.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'API Request Failed');
  }

  // Handle empty or JSON responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

export const api = {
  auth: {
    login: (email, password) => 
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    register: (email, password, firstName, lastName) => 
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName })
      }),
  },
  tree: {
    getAll: () => request('/tree'),
    get: (treeId) => request(`/tree/${treeId}`),
    getPublic: () => request('/tree/public'),
    create: (name, isPublic) => 
      request('/tree', {
        method: 'POST',
        body: JSON.stringify({ name, isPublic })
      }),
    updateGraph: (treeId, graphData) => 
      request(`/tree/${treeId}`, {
        method: 'PUT',
        body: JSON.stringify({ treeGraphJsonData: typeof graphData === 'string' ? graphData : JSON.stringify(graphData) })
      }),
    updatePrivacy: (treeId, isPublic) =>
      request(`/tree/${treeId}/privacy`, {
        method: 'PUT',
        body: JSON.stringify({ isPublic })
      }),
    delete: (treeId) =>
      request(`/tree/${treeId}`, {
        method: 'DELETE'
      }),
    addCollaborator: (treeId, email, role) => 
      request(`/tree/${treeId}/collaborator`, {
        method: 'POST',
        body: JSON.stringify({ email, role })
      }),
    removeCollaborator: (treeId, userId) => 
      request(`/tree/${treeId}/collaborator/${userId}`, {
        method: 'DELETE'
      }),

  },
  profile: {
    get: (treeId, personId) => request(`/tree/${treeId}/profile/${personId}`),
    update: (treeId, personId, data) => 
      request(`/tree/${treeId}/profile/${personId}`, {
        method: 'POST',
        body: JSON.stringify(data) // data is { biography, photoAlbum }
      }),
    uploadPhoto: (treeId, personId, file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request(`/tree/${treeId}/profile/${personId}/upload`, {
        method: 'POST',
        body: formData
      });
    }
  }
};
