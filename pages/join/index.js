// pages/join/index.js
import { API } from '../../utils/config.js';

// 引入一个新的库，让wx.request支持Promise
// 您需要在 utils 文件夹下创建一个新文件 wx-promise-request.js
// 并将 `const pro = {}; Object.keys(wx).forEach(key => { if(Object.prototype.toString.call(wx[key]) === '[object Function]') { pro[key] = (obj = {}) => new Promise((resolve, reject) => { obj.success = res => resolve(res); obj.fail = err => reject(err); wx[key](obj); }); } }); wx.pro = pro;` 这段代码放进去
// 为了简化，我们暂时直接使用回调函数
// import wx_pro from '../../utils/wx-promise-request.js';


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
    const token = options.token;
    if (token) {
      this.setData({ token });
      this.fetchInvitationInfo(token);
    } else {
      this.setData({ isLoading: false, errorMsg: '无效的邀请链接' });
    }
  },

  fetchInvitationInfo(token) {
    wx.request({
      url: API.getInvitationInfo(token),
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({
            invitationInfo: res.data.data,
            isLoading: false
          });
        } else {
          this.setData({
            isLoading: false,
            errorMsg: res.data.message || '邀请链接已失效'
          });
        }
      },
      fail: (err) => {
        this.setData({
          isLoading: false,
          errorMsg: '网络错误，无法验证邀请'
        });
      }
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`newMember.${field}`]: e.detail.value
    });
  },

  handleJoin() {
    if (!this.data.newMember.name.trim()) {
      return wx.showToast({ title: '请输入您的姓名', icon: 'none' });
    }

    wx.showLoading({ title: '正在加入...' });

    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          const postData = {
            code: loginRes.code,
            ...this.data.newMember
          };
          wx.request({
            url: API.acceptInvitation(this.data.token),
            method: 'POST',
            data: postData,
            success: (joinRes) => {
              wx.hideLoading();
              if (joinRes.statusCode === 201 && joinRes.data.code === 201) {
                wx.showModal({
                  title: '成功',
                  content: '您已成功加入家族！',
                  showCancel: false,
                  success: () => {
                    this.backToHome();
                  }
                });
              } else {
                wx.showToast({ title: joinRes.data.message || '操作失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '请求失败', icon: 'none' });
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({ title: '登录失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '微信登录调用失败', icon: 'none' });
      }
    });
  },

  backToHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});
