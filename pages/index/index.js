// pages/index/index.js
import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

const app = getApp();

Page({
  data: {
    isLoading: true,        // 页面初始加载状态
    isTreeLoading: false,   // 族谱树加载状态
    families: [],           // 用户的所有家族列表
    activeFamilyId: null,   // 当前选中的家族ID
    activeFamilyData: null, // 当前家族的树状数据
    showModal: false,       // 控制创建家族弹窗的显示
    newFamilyName: '',      // 新家族名称
    newFamilyDesc: '',      // 新家族简介
  },

  onLoad() {
    // 检查全局数据是否已准备好
    if (app.globalData.families) {
      this.handleFamiliesLoaded(app.globalData.families);
    } else {
      // 如果全局数据未就绪，则设置一个回调函数，等待app.js加载完数据后通知我
      app.userFamiliesReadyCallback = (families) => {
        this.handleFamiliesLoaded(families);
      };
    }
  },

  // 处理从app.js传来的家族列表数据
  handleFamiliesLoaded(families) {
    this.setData({
      families: families,
      isLoading: false,
    });

    if (families && families.length > 0) {
      // 如果有家族，默认选中第一个，并去获取它的族谱树
      const firstFamilyId = families[0].id;
      this.switchFamily({ currentTarget: { dataset: { id: firstFamilyId } } });
    }
  },

  // 切换家族
  switchFamily(e) {
    const familyId = e.currentTarget.dataset.id;
    if (familyId === this.data.activeFamilyId) {
      return; // 如果点击的是当前已选中的家族，则不重复加载
    }
    this.setData({
      activeFamilyId: familyId,
      activeFamilyData: null, // 清空旧数据
      isTreeLoading: true,
    });
    this.fetchFamilyTree(familyId);
  },

  // 根据familyId获取族谱树
  async fetchFamilyTree(familyId) {
    try {
      const res = await request({
        url: API.getFamilyTree(familyId),
      });
      this.setData({
        activeFamilyData: res.data,
        isTreeLoading: false,
      });
    } catch (error) {
      console.error(`获取家族(id=${familyId})的族谱树失败:`, error);
      this.setData({ isTreeLoading: false });
    }
  },

  // --- 创建家族相关 ---
  showCreateFamilyModal() {
    this.setData({ showModal: true });
  },
  hideCreateFamilyModal() {
    this.setData({ showModal: false, newFamilyName: '', newFamilyDesc: '' });
  },
  async handleCreateFamily() {
    if (!this.data.newFamilyName.trim()) {
      wx.showToast({ title: '家族名称不能为空', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '创建中...' });
      await request({
        url: API.createFamily,
        method: 'POST',
        data: {
          name: this.data.newFamilyName,
          description: this.data.newFamilyDesc,
        },
      });
      wx.hideLoading();
      this.hideCreateFamilyModal();
      wx.showToast({ title: '创建成功！', icon: 'success' });

      // 创建成功后，需要重新加载全局的家族列表
      await app.loadUserFamilies();

    } catch (error) {
      wx.hideLoading();
      console.error('创建家族失败:', error);
    }
  },
});
