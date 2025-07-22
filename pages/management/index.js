// pages/management/index.js
import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

Page({
  data: {
    familyId: null,
    members: [],
    isLoading: true,
    errorMsg: '',
    roleOptions: [
      { value: 'admin', text: '管理员' },
      { value: 'editor', text: '编辑者' },
      { value: 'member', text: '成员' },
    ],
    // 用于picker的value和实际role值的映射
    roleMapping: {
      'admin': 0,
      'editor': 1,
      'member': 2,
    }
  },

  onLoad(options) {
    if (options.familyId) {
      this.setData({ familyId: options.familyId });
      wx.setNavigationBarTitle({ title: options.familyName + ' - 成员管理' });
      this.fetchMembers();
    } else {
      this.setData({ isLoading: false, errorMsg: '无效的家族信息' });
    }
  },

  async fetchMembers() {
    this.setData({ isLoading: true });
    try {
      const res = await request({
        url: API.getFamilyRoles(this.data.familyId)
      });
      this.setData({ members: res.data, isLoading: false });
    } catch (error) {
      this.setData({
        isLoading: false,
        errorMsg: error.data.message || '加载失败，您可能不是管理员'
      });
    }
  },

  onRoleChange(e) {
    const newRoleIndex = e.detail.value;
    const newRole = this.data.roleOptions[newRoleIndex].value;
    const { userid, nickname } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认修改',
      content: `确定要将「${nickname}」的角色修改为「${this.data.roleOptions[newRoleIndex].text}」吗？`,
      success: (res) => {
        if (res.confirm) {
          this.updateUserRole(userid, newRole);
        }
      }
    });
  },

  async updateUserRole(userId, role) {
    wx.showLoading({ title: '正在修改...' });
    try {
      await request({
        url: API.updateUserRole(this.data.familyId, userId),
        method: 'PUT',
        data: { role }
      });
      wx.hideLoading();
      wx.showToast({ title: '修改成功', icon: 'success' });
      // 刷新列表以显示最新角色
      this.fetchMembers();
    } catch (error) {
      wx.hideLoading();
      // 错误提示已在request.js中统一处理
    }
  }
});
