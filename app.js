// app.js
import { API } from './utils/config.js';
import request from './utils/request.js';

App({
  onLaunch() {
    // 【修正】在此处获取设备信息，为自定义导航栏做准备
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    this.globalData.navBarHeight = menuButtonInfo.height + (menuButtonInfo.top - this.globalData.statusBarHeight) * 2;

    // 【恢复】调用您项目原有的登录检查逻辑
    this.checkLoginStatus();
  },
  
  // 【恢复】您项目原有的登录检查函数
  async checkLoginStatus() {
    const token = wx.getStorageSync('token');
    // 注意：您原始代码中的 && false 会强制执行 else 块，这里予以保留
    if (token && false) {
      console.log('本地存在token，视为已登录');
      this.globalData.token = token;
      await this.loadUserFamilies();
    } else {
      console.log('本地无token，执行登录流程');
      await this.doLogin();
    }
  },

  // 【恢复】您项目原有的登录执行函数
  async doLogin() {
    try {
      const { code } = await wx.login();
      const loginRes = await request({
        url: API.login,
        method: 'POST',
        data: { code }
      });
      const token = loginRes.data.token;
      this.globalData.token = token;
      wx.setStorageSync('token', token);
      
      await this.loadUserFamilies();

    } catch (error) {
      console.error('登录流程出错:', error);
      // 可以在这里统一处理错误，例如提示用户
    }
  },

  // 【恢复】您项目原有的获取家族列表的函数
  async loadUserFamilies() {
    try {
      const res = await request({
        url: API.getUserFamilies,
        method: 'GET'
      });
      this.globalData.families = res.data;

      // 使用回调函数通知页面数据已更新
      if (this.userFamiliesReadyCallback) {
        this.userFamiliesReadyCallback(res.data);
      }

    } catch (error) {
      console.error('获取用户家族列表失败:', error);
      this.globalData.families = []; // 即使失败也初始化为空数组，避免页面出错
    }
  },

  globalData: {
    token: null,
    families: null, 
    statusBarHeight: 0,
    navBarHeight: 0
  }
})
