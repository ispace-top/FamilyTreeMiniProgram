// app.js
import { API } from './utils/config.js';
import request from './utils/request.js'; // 导入我们封装的request函数

App({
  onLaunch() {
    this.checkLoginStatus();
  },

  // 检查登录状态
  async checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      console.log('本地存在token，视为已登录');
      this.globalData.token = token;
      // 登录后，立即获取用户的家族列表
      await this.loadUserFamilies();
    } else {
      console.log('本地无token，执行登录流程');
      await this.doLogin();
    }
  },

  // 执行登录
  async doLogin() {
    try {
      const { code } = await wx.login();
      const loginRes = await request({
        url: API.login,
        method: 'POST',
        data: { code }
      });
      
      const token = loginRes.data.token;
      console.log('登录成功，获取到token:', token);
      this.globalData.token = token;
      wx.setStorageSync('token', token);
      
      // 登录成功后，也需要获取家族列表
      await this.loadUserFamilies();

    } catch (error) {
      console.error('登录流程出错:', error);
    }
  },

  // 获取并存储用户的家族列表
  async loadUserFamilies() {
    try {
      const res = await request({
        url: API.getUserFamilies,
        method: 'GET'
      });
      console.log('获取到用户家族列表:', res.data);
      this.globalData.families = res.data;

      // 使用回调函数通知页面数据已更新
      // 这是一种简单的页面通信方式
      if (this.userFamiliesReadyCallback) {
        this.userFamiliesReadyCallback(res.data);
      }

    } catch (error) {
      console.error('获取用户家族列表失败:', error);
      this.globalData.families = []; // 出错时设置为空数组
    }
  },

  globalData: {
    token: null,
    families: null, // 用于存储用户的家族列表
  }
})
