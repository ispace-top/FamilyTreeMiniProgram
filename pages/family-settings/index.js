// pages/family-settings/index.js
import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

const app = getApp();

Page({
  data: {
    familyId: null,
    familyName: '',
    familyDesc: '',
    familyIntro: '',
    avatarUrl: '',
    bannerUrl: '',
  },

  onLoad(options) {
    if (options.familyId) {
      this.setData({
        familyId: options.familyId,
        familyName: options.familyName || '',
        familyDesc: options.familyDesc || '',
        familyIntro: options.familyIntro || '',
        avatarUrl: options.avatarUrl || '',
        bannerUrl: options.bannerUrl || '',
      });
      wx.setNavigationBarTitle({ title: `${options.familyName} - 设置` });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },

  // --- 新增：图片上传逻辑 ---
  handleUploadImage(e) {
    const { type } = e.currentTarget.dataset; // 'avatar' or 'banner'
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        
        const token = wx.getStorageSync('token');
        wx.uploadFile({
          url: API.uploadImage,
          filePath: tempFilePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${token}`
          },
          formData: {
            'type': type
          },
          success: (uploadRes) => {
            wx.hideLoading();
            const result = JSON.parse(uploadRes.data);
            if (result.code === 200) {
              const url = result.data.url;
              if (type === 'avatar') {
                this.setData({ avatarUrl: url });
              } else {
                this.setData({ bannerUrl: url });
              }
              wx.showToast({ title: '上传成功', icon: 'success' });
            } else {
              wx.showToast({ title: result.message || '上传失败', icon: 'none' });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '上传请求失败', icon: 'none' });
          }
        });
      }
    });
  },

  async handleSave() {
    if (!this.data.familyName.trim()) {
      return wx.showToast({ title: '家族名称不能为空', icon: 'none' });
    }

    wx.showLoading({ title: '正在保存...' });
    try {
      await request({
        url: API.updateFamily(this.data.familyId),
        method: 'PUT',
        data: {
          name: this.data.familyName,
          description: this.data.familyDesc,
          introduction: this.data.familyIntro, // 确保introduction也被保存
          avatar: this.data.avatarUrl,
          banner: this.data.bannerUrl
        }
      });
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      
      await app.loadUserFamilies();
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      wx.hideLoading();
    }
  },

  handleDelete() {
    wx.showModal({
      title: '危险操作',
      content: `您确定要解散「${this.data.familyName}」吗？此操作将永久删除家族及其所有成员信息，无法恢复！`,
      confirmColor: '#f56c6c',
      success: async (res) => {
        if (res.confirm) {
          this.performDelete();
        }
      }
    });
  },

  async performDelete() {
    wx.showLoading({ title: '正在解散...' });
    try {
      await request({
        url: API.deleteFamily(this.data.familyId),
        method: 'DELETE'
      });
      wx.hideLoading();
      await wx.showModal({ title: '操作成功', content: '家族已解散', showCancel: false });
      await app.loadUserFamilies();
      wx.navigateBack();
    } catch (error) {
      wx.hideLoading();
    }
  }
});
