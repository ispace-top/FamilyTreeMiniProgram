// pages/join/index.js
import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

Page({
  data: {
    token: null,
    invitationInfo: null,
    isLoading: true,
    errorMsg: '',
    newMember: {
      name: '',
      gender: 'male',
      birth_date: ''
    }
  },

  onLoad(options) {
    // 页面加载时，从options中获取邀请令牌
    const token = options.token;
    if (token) {
      this.setData({ token });
      this.fetchInvitationInfo(token);
    } else {
      this.setData({ isLoading: false, errorMsg: '无效的邀请链接' });
    }
  },

  // 获取邀请信息
  async fetchInvitationInfo(token) {
    try {
      const res = await request({
        url: API.getInvitationInfo(token)
      });
      this.setData({
        invitationInfo: res.data,
        isLoading: false
      });
    } catch (error) {
      this.setData({
        isLoading: false,
        errorMsg: error.data.message || '邀请链接已失效'
      });
    }
  },

  // 处理表单输入
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`newMember.${field}`]: e.detail.value
    });
  },

  // 点击确认加入
  async handleJoin() {
    if (!this.data.newMember.name.trim()) {
      return wx.showToast({ title: '请输入您的姓名', icon: 'none' });
    }

    wx.showLoading({ title: '正在加入...' });

    try {
      // 1. 先获取小程序的登录code
      const { code } = await wx.login();

      // 2. 发起加入请求
      await request({
        url: API.acceptInvitation(this.data.token),
        method: 'POST',
        data: {
          code,
          ...this.data.newMember
        }
      });
      
      wx.hideLoading();
      wx.showModal({
        title: '成功',
        content: '您已成功加入家族！',
        showCancel: false,
        success: () => {
          this.backToHome();
        }
      });

    } catch (error) {
      wx.hideLoading();
      console.error('加入家族失败:', error);
      wx.showToast({ title: error.data.message || '操作失败', icon: 'none' });
    }
  },

  // 返回首页
  backToHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});
