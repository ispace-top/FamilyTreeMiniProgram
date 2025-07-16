// pages/index/index.js
import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

const app = getApp();

Page({
  data: {
    isLoading: true,
    isTreeLoading: false,
    families: [],
    activeFamilyId: null,
    activeFamilyData: null,
    
    // 创建家族弹窗相关
    showModal: false,
    newFamilyName: '',
    newFamilyDesc: '',

    // 添加成员弹窗相关
    showAddMemberModal: false,
    newMember: {
      name: '',
      gender: 'male', // 默认为男性
    },
  },

  onLoad() {
    if (app.globalData.families) {
      this.handleFamiliesLoaded(app.globalData.families);
    } else {
      app.userFamiliesReadyCallback = (families) => {
        this.handleFamiliesLoaded(families);
      };
    }
  },

  handleFamiliesLoaded(families) {
    this.setData({
      families: families,
      isLoading: false,
    });
    if (families && families.length > 0) {
      const firstFamilyId = families[0].id;
      this.switchFamily({ currentTarget: { dataset: { id: firstFamilyId } } });
    }
  },

  switchFamily(e) {
    const familyId = e.currentTarget.dataset.id;
    if (familyId === this.data.activeFamilyId) return;
    this.setData({
      activeFamilyId: familyId,
      activeFamilyData: null,
      isTreeLoading: true,
    });
    this.fetchFamilyTree(familyId);
  },

  async fetchFamilyTree(familyId) {
    try {
      const res = await request({ url: API.getFamilyTree(familyId) });
      this.setData({
        activeFamilyData: res.data,
        isTreeLoading: false,
      });
    } catch (error) {
      console.error(`获取家族(id=${familyId})的族谱树失败:`, error);
      this.setData({ isTreeLoading: false });
    }
  },

  // --- 创建家族相关 (保持不变) ---
  showCreateFamilyModal() { this.setData({ showModal: true }); },
  hideCreateFamilyModal() { this.setData({ showModal: false, newFamilyName: '', newFamilyDesc: '' }); },
  async handleCreateFamily() {
    if (!this.data.newFamilyName.trim()) {
      return wx.showToast({ title: '家族名称不能为空', icon: 'none' });
    }
    try {
      wx.showLoading({ title: '创建中...' });
      await request({ url: API.createFamily, method: 'POST', data: { name: this.data.newFamilyName, description: this.data.newFamilyDesc } });
      wx.hideLoading();
      this.hideCreateFamilyModal();
      wx.showToast({ title: '创建成功！', icon: 'success' });
      await app.loadUserFamilies();
    } catch (error) {
      wx.hideLoading();
      console.error('创建家族失败:', error);
    }
  },

  // --- 添加成员相关 ---
  showAddMemberModal() {
    this.setData({ showAddMemberModal: true });
  },

  hideAddMemberModal() {
    this.setData({
      showAddMemberModal: false,
      newMember: { name: '', gender: 'male' }
    });
  },

  // 新增：处理姓名输入事件，确保数据能被正确捕获
  onNameInput(e) {
    this.setData({
      'newMember.name': e.detail.value
    });
  },

  onGenderChange(e) {
    this.setData({
      'newMember.gender': e.detail.value
    });
  },

  async handleCreateMember() {
    const { name, gender } = this.data.newMember;
    const familyId = this.data.activeFamilyId;

    if (!name.trim()) {
      return wx.showToast({ title: '姓名不能为空', icon: 'none' });
    }

    try {
      wx.showLoading({ title: '添加中...' });
      await request({
        url: API.createMember(familyId),
        method: 'POST',
        data: { name, gender }
      });
      wx.hideLoading();
      this.hideAddMemberModal();
      wx.showToast({ title: '添加成功！', icon: 'success' });

      // 关键：添加成功后，重新加载当前家族的族谱树
      this.fetchFamilyTree(familyId);

    } catch (error) {
      wx.hideLoading();
      console.error('添加成员失败:', error);
    }
  }
});
