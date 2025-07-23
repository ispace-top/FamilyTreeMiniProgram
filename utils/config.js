// utils/config.js
// 请将这里的URL替换成您自己的服务器地址
const API_BASE_URL = 'http://localhost:3000'; 

const API = {
  // 认证
  login: `${API_BASE_URL}/api/auth/login`,

  // 家族相关
  getUserFamilies: `${API_BASE_URL}/api/user/families`,
  createFamily: `${API_BASE_URL}/api/families`,
  getFamilyTree: (familyId) => `${API_BASE_URL}/api/families/${familyId}/tree`,
  updateFamily: (familyId) => `${API_BASE_URL}/api/families/${familyId}`,
  deleteFamily: (familyId) => `${API_BASE_URL}/api/families/${familyId}`,
  getFamilyDetails: (familyId) => `${API_BASE_URL}/api/families/${familyId}/details`,

  // 成员相关
  createMember: (familyId) => `${API_BASE_URL}/api/families/${familyId}/members`,
  getMemberDetail: (memberId) => `${API_BASE_URL}/api/members/${memberId}`,
  updateMember: (memberId) => `${API_BASE_URL}/api/members/${memberId}`,
  
  // 配偶相关
  searchMembers: (familyId, name, currentMemberId) => `${API_BASE_URL}/api/families/${familyId}/members/search?name=${name}&currentMemberId=${currentMemberId}`,
  linkSpouse: (memberId) => `${API_BASE_URL}/api/members/${memberId}/spouse`,

  // 关系相关
  getMemberRelations: (memberId) => `${API_BASE_URL}/api/members/${memberId}/relations`,

  // 搜索
  searchAllMembers: (familyId, keyword) => `${API_BASE_URL}/api/families/${familyId}/search-all?keyword=${keyword}`,

  // 邀请相关
  createInvitation: (familyId) => `${API_BASE_URL}/api/families/${familyId}/invitations`,
  getInvitationInfo: (token) => `${API_BASE_URL}/api/invitations/${token}`,
  acceptInvitation: (token) => `${API_BASE_URL}/api/invitations/${token}/join`,

  // 权限管理
  getFamilyRoles: (familyId) => `${API_BASE_URL}/api/families/${familyId}/roles`,
  updateUserRole: (familyId, userId) => `${API_BASE_URL}/api/families/${familyId}/users/${userId}/role`,

  // 身份认领
  claimMember: (familyId) => `${API_BASE_URL}/api/families/${familyId}/claim-member`,

  matchProfile: (familyId) => `${API_BASE_URL}/api/families/${familyId}/match-profile`,
};

// 确保 API 对象被正确导出
export { API };
