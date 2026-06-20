import api from './api';

const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.success && response.data) {
    localStorage.setItem('userInfo', JSON.stringify(response.data));
  }
  return response.data;
};

const register = async (username, email, password, phone, age) => {
  const response = await api.post('/auth/register', { username, email, password, phone, age });
  if (response.success && response.data) {
    localStorage.setItem('userInfo', JSON.stringify(response.data));
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('userInfo');
};

const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  if (response.success && response.data) {
    localStorage.setItem('userInfo', JSON.stringify(response.data));
  }
  return response.data;
};

const getCurrentUser = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    return null;
  }
};

const authService = {
  login,
  register,
  logout,
  getProfile,
  updateProfile,
  getCurrentUser,
};

export default authService;
