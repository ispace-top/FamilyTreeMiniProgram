// utils/config.js

// 后端服务的根地址
const API_BASE_URL = 'http://localhost:3000'; 

// 统一管理所有的API接口路径
const API = {
  // 认证
  login: `${API_BASE_URL}/api/auth/login`,

  // 家族相关
  getUserFamilies: `${API_BASE_URL}/api/user/families`,
  createFamily: `${API_BASE_URL}/api/families`,
  getFamilyTree: (familyId) => `${API_BASE_URL}/api/families/${familyId}/tree`,

  // 成员相关 (预留)
  getMemberDetail: (memberId) => `${API_BASE_URL}/api/member/${memberId}`,
};

// 导出配置
export { API };
