// pages/family-settings/index.js
import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

const app = getApp();

Page({
  data: {
    familyId: null,
    familyName: '',
    familyDesc: '',
  },

  onLoad(options) {
    if (options.familyId) {
      this.setData({
        familyId: options.familyId,
        familyName: options.familyName || '',
        familyDesc: options.familyDesc || ''
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
          description: this.data.familyDesc
        }
      });
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      
      // 刷新全局数据并通知首页
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
      
      await wx.showModal({
        title: '操作成功',
        content: '家族已解散',
        showCancel: false
      });

      // 刷新全局数据并返回首页
      await app.loadUserFamilies();
      wx.navigateBack();

    } catch (error) {
      wx.hideLoading();
    }
  }
});
