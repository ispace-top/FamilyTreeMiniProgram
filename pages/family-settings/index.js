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
  /**
   * 重构后的图片上传函数 (即传即存)
   */
  async handleUploadImage(e) {
    const { type } = e.currentTarget.dataset; // 'avatar' 或 'banner'
    const familyId = this.data.familyId;

    if (!familyId) {
      wx.showToast({ title: '缺少家族ID', icon: 'none' });
      return;
    }

    // 1. 根据类型，确定正确的上传接口地址
    let apiUrl = '';
    switch (type) {
      case 'avatar':
        apiUrl = API.uploadFamilyAvatar(familyId);
        break;
      case 'banner':
        apiUrl = API.uploadFamilyBanner(familyId); // <-- 修正这里的 bug
        break;
      default:
        wx.showToast({ title: '未知的上传类型', icon: 'none' });
        return;
    }

    // 2. 选择图片
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        const token = wx.getStorageSync('token');

        // 3. 上传文件 (后端会自动保存)
        wx.uploadFile({
          url: apiUrl,
          filePath: tempFilePath,
          name: 'file',
          method: 'POST', // 后端接口已统一为 POST
          header: { 'Authorization': `Bearer ${token}` },
          success: (uploadRes) => {
            wx.hideLoading();
            const result = JSON.parse(uploadRes.data);
            
            if (result.code === 200) {
              const url = result.data.url;
              
              // 4. 上传成功后，立即更新当前页面的数据显示
              if (type === 'avatar') {
                this.setData({ 'family.avatar': url, avatarUrl: url }); // 同时更新 family 对象和顶层变量
              } else if (type === 'banner') {
                this.setData({ 'family.banner': url, bannerUrl: url }); // 同时更新 family 对象和顶层变量
              }
              wx.showToast({ title: '上传成功', icon: 'success' });

              // 通知全局数据更新
              app.loadUserFamilies();

            } else {
              wx.showToast({ title: result.message || '上传失败', icon: 'none' });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            console.error('上传请求失败:', err);
            wx.showToast({ title: '上传请求失败', icon: 'none' });
          }
        });
      },
    });
  },

  /**
   * 重构后的保存函数 (只负责保存文本信息)
   */
  async handleSave() {
    if (!this.data.familyName.trim()) {
      return wx.showToast({ title: '家族名称不能为空', icon: 'none' });
    }

    wx.showLoading({ title: '正在保存...' });
    try {
      // 注意：这里不再传递 avatar 和 banner 的 URL，因为它们在上传时已经独立保存了
      await request({
        url: API.updateFamily(this.data.familyId),
        method: 'PUT',
        data: {
          name: this.data.familyName,
          description: this.data.familyDesc,
          introduction: this.data.familyIntro,
        }
      });
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      
      // 更新全局的家族列表信息
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
