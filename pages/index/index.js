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
    currentUserRole: 'member',
    showModal: false,
    newFamilyName: '',
    newFamilyDesc: '',
    showAddMemberModal: false,
    newMember: {
      name: '',
      gender: 'male',
    },
  },

  onLoad() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    if (app.globalData.families) {
      this.handleFamiliesLoaded(app.globalData.families);
    } else {
      app.userFamiliesReadyCallback = (families) => {
        this.handleFamiliesLoaded(families);
      };
    }
  },
  
  // --- 新增：跳转到成员管理页 ---
  navigateToManagement() {
    const activeFamily = this.data.families.find(f => f.id === this.data.activeFamilyId);
    if (!activeFamily) return;

    wx.navigateTo({
      url: `/pages/management/index?familyId=${activeFamily.id}&familyName=${activeFamily.name}`
    });
  },

  // --- 其他函数保持不变 ---
  onShareAppMessage() {
    const activeFamily = this.data.families.find(f => f.id === this.data.activeFamilyId);
    const familyName = activeFamily ? activeFamily.name : '我的家族';
    return {
      title: `邀请您加入「${familyName}」`,
      promise: this.generateSharePromise()
    }
  },
  async generateSharePromise() {
    try {
      if (!this.data.activeFamilyId) throw new Error("没有选中的家族");
      const res = await request({
        url: API.createInvitation(this.data.activeFamilyId),
        method: 'POST'
      });
      const token = res.data.token;
      return { path: `/pages/join/index?token=${token}` }
    } catch (error) {
      wx.showToast({ title: '生成邀请失败', icon: 'none' });
      return { path: '/pages/index/index' }
    }
  },
  handleFamiliesLoaded(families) {
    this.setData({ families: families, isLoading: false, });
    if (families && families.length > 0) {
      const firstFamilyId = families[0].id;
      this.switchFamily({ currentTarget: { dataset: { id: firstFamilyId } } });
    }
  },
  switchFamily(e) {
    const familyId = e.currentTarget.dataset.id;
    if (familyId === this.data.activeFamilyId) return;
    const currentFamily = this.data.families.find(f => f.id === familyId);
    const userRole = currentFamily ? currentFamily.role : 'member';
    this.setData({
      activeFamilyId: familyId,
      activeFamilyData: null,
      isTreeLoading: true,
      currentUserRole: userRole,
    });
    this.fetchFamilyTree(familyId);
  },
  async fetchFamilyTree(familyId) {
    try {
      const res = await request({ url: API.getFamilyTree(familyId) });
      this.setData({ activeFamilyData: res.data, isTreeLoading: false, });
    } catch (error) {
      this.setData({ isTreeLoading: false });
    }
  },
  navigateToSearch() {
    if (!this.data.activeFamilyId) return;
    wx.navigateTo({
      url: `/pages/search/index?familyId=${this.data.activeFamilyId}&role=${this.data.currentUserRole}`
    });
  },
  showCreateFamilyModal() { this.setData({ showModal: true }); },
  hideCreateFamilyModal() { this.setData({ showModal: false, newFamilyName: '', newFamilyDesc: '' }); },
  async handleCreateFamily() {
    if (!this.data.newFamilyName.trim()) { return wx.showToast({ title: '家族名称不能为空', icon: 'none' }); }
    try {
      wx.showLoading({ title: '创建中...' });
      await request({ url: API.createFamily, method: 'POST', data: { name: this.data.newFamilyName, description: this.data.newFamilyDesc } });
      wx.hideLoading();
      this.hideCreateFamilyModal();
      wx.showToast({ title: '创建成功！', icon: 'success' });
      await app.loadUserFamilies();
    } catch (error) {
      wx.hideLoading();
    }
  },
  showAddMemberModal() { this.setData({ showAddMemberModal: true }); },
  hideAddMemberModal() { this.setData({ showAddMemberModal: false, newMember: { name: '', gender: 'male' } }); },
  onNameInput(e) { this.setData({ 'newMember.name': e.detail.value }); },
  onGenderChange(e) { this.setData({ 'newMember.gender': e.detail.value }); },
  async handleCreateMember() {
    const { name, gender } = this.data.newMember;
    const familyId = this.data.activeFamilyId;
    if (!name.trim()) { return wx.showToast({ title: '姓名不能为空', icon: 'none' }); }
    try {
      wx.showLoading({ title: '添加中...' });
      await request({ url: API.createMember(familyId), method: 'POST', data: { name, gender } });
      wx.hideLoading();
      this.hideAddMemberModal();
      wx.showToast({ title: '添加成功！', icon: 'success' });
      this.fetchFamilyTree(familyId);
    } catch (error) {
      wx.hideLoading();
    }
  },
});
