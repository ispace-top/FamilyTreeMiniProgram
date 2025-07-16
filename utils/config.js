// utils/config.js

const API_BASE_URL = 'http://localhost:3000'; 

const API = {
  // 认证
  login: `${API_BASE_URL}/api/auth/login`,

  // 家族相关
  getUserFamilies: `${API_BASE_URL}/api/user/families`,
  createFamily: `${API_BASE_URL}/api/families`,
  getFamilyTree: (familyId) => `${API_BASE_URL}/api/families/${familyId}/tree`,

  // 新增：成员相关
  createMember: (familyId) => `${API_BASE_URL}/api/families/${familyId}/members`,
  getMemberDetail: (memberId) => `${API_BASE_URL}/api/member/${memberId}`,
};

export { API };
