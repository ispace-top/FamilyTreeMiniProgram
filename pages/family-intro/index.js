// pages/family-intro/index.js
import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

const app = getApp();

Page({
  data: {
    familyId: null,
    userRole: 'member',
    familyDetails: null,
    editableIntro: '',
    isLoading: true,
    isEditing: false,
    errorMsg: ''
  },

  onLoad(options) {
    if (options.familyId) {
      this.setData({
        familyId: options.familyId,
        userRole: options.userRole || 'member'
      });
      wx.setNavigationBarTitle({ title: `${options.familyName} - 介绍` });
      this.fetchFamilyDetails();
    } else {
      this.setData({ isLoading: false, errorMsg: '无效的家族信息' });
    }
  },

  async fetchFamilyDetails() {
    this.setData({ isLoading: true });
    try {
      const res = await request({
        url: API.getFamilyDetails(this.data.familyId)
      });
      this.setData({
        familyDetails: res.data,
        editableIntro: res.data.introduction || '',
        isLoading: false
      });
    } catch (error) {
      this.setData({
        isLoading: false,
        errorMsg: error.data.message || '加载失败'
      });
    }
  },

  toggleEditMode() {
    if (this.data.isEditing) {
      // 取消编辑，恢复原始数据
      this.setData({
        editableIntro: this.data.familyDetails.introduction || '',
        isEditing: false
      });
    } else {
      this.setData({ isEditing: true });
    }
  },

  onIntroInput(e) {
    this.setData({
      editableIntro: e.detail.value
    });
  },

  async handleSave() {
    wx.showLoading({ title: '正在保存...' });
    try {
      await request({
        url: API.updateFamily(this.data.familyId),
        method: 'PUT',
        data: {
          name: this.data.familyDetails.name,
          description: this.data.familyDetails.description,
          introduction: this.data.editableIntro
        }
      });
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.setData({ isEditing: false });
      // 重新加载数据以显示最新内容
      this.fetchFamilyDetails();
    } catch (error) {
      wx.hideLoading();
    }
  }
});
