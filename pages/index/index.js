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
    activeFamilyName: '', // 新增：保存当前家族名称
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
  },
  
  // 页面显示时，重新检查全局数据，确保从其他页面返回时能刷新
  onShow() {
    if (app.globalData.families) {
      this.handleFamiliesLoaded(app.globalData.families);
    } else {
      app.userFamiliesReadyCallback = (families) => {
        this.handleFamiliesLoaded(families);
      };
    }
  },

  handleFamiliesLoaded(families) {
    this.setData({ families: families, isLoading: false, });
    if (families && families.length > 0) {
      const activeFamilyExists = families.some(f => f.id === this.data.activeFamilyId);
      if (!this.data.activeFamilyId || !activeFamilyExists) {
        const firstFamily = families[0];
        this.switchFamily(firstFamily.id, firstFamily.name);
      }
    } else {
      this.setData({ activeFamilyId: null, activeFamilyData: null, activeFamilyName: '' });
      wx.setNavigationBarTitle({ title: '清风族谱' });
    }
  },

  // 切换家族 (逻辑已修改)
  switchFamily(familyId, familyName) {
    if (familyId === this.data.activeFamilyId) return;
    
    const currentFamily = this.data.families.find(f => f.id === familyId);
    const userRole = currentFamily ? currentFamily.role : 'member';

    this.setData({
      activeFamilyId: familyId,
      activeFamilyName: familyName,
      activeFamilyData: null,
      isTreeLoading: true,
      currentUserRole: userRole,
    });
    // 将家族名称设置到标题栏
    wx.setNavigationBarTitle({ title: familyName });
    this.fetchFamilyTree(familyId);
  },
  
  // 新增：通过ActionSheet切换家族
  switchFamilyBySheet() {
    const familyNames = this.data.families.map(f => f.name);
    wx.showActionSheet({
      itemList: familyNames,
      success: (res) => {
        const selectedFamily = this.data.families[res.tapIndex];
        this.switchFamily(selectedFamily.id, selectedFamily.name);
      }
    });
  },

  // 新增：显示操作菜单
  showActionSheet() {
    const itemList = ['邀请成员', '创建新家族'];
    if (this.data.currentUserRole === 'admin') {
      itemList.push('成员管理', '家族设置');
    }
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        const tapIndex = res.tapIndex;
        if (itemList[tapIndex] === '邀请成员') {
          wx.showToast({ title: '请点击右上角“...”进行分享', icon: 'none' });
        } else if (itemList[tapIndex] === '创建新家族') {
          this.showCreateFamilyModal();
        } else if (itemList[tapIndex] === '成员管理') {
          this.navigateToManagement();
        } else if (itemList[tapIndex] === '家族设置') {
          this.navigateToFamilySettings();
        }
      }
    });
  },

  // --- 其他函数保持不变，但跳转逻辑微调 ---
  navigateToFamilySettings() {
    const activeFamily = this.data.families.find(f => f.id === this.data.activeFamilyId);
    if (!activeFamily) return;
    wx.navigateTo({
      url: `/pages/family-settings/index?familyId=${activeFamily.id}&familyName=${activeFamily.name}&familyDesc=${activeFamily.description || ''}`
    });
  },
  navigateToManagement() {
    const activeFamily = this.data.families.find(f => f.id === this.data.activeFamilyId);
    if (!activeFamily) return;
    wx.navigateTo({
      url: `/pages/management/index?familyId=${activeFamily.id}&familyName=${activeFamily.name}`
    });
  },
  navigateToSearch() {
    if (!this.data.activeFamilyId) return;
    wx.navigateTo({
      url: `/pages/search/index?familyId=${this.data.activeFamilyId}&role=${this.data.currentUserRole}`
    });
  },
  onShareAppMessage() {
    return {
      title: `邀请您加入「${this.data.activeFamilyName}」`,
      promise: this.generateSharePromise()
    }
  },
  async generateSharePromise() {
    try {
      if (!this.data.activeFamilyId) throw new Error("没有选中的家族");
      const res = await request({ url: API.createInvitation(this.data.activeFamilyId), method: 'POST' });
      return { path: `/pages/join/index?token=${res.data.token}` }
    } catch (error) {
      wx.showToast({ title: '生成邀请失败', icon: 'none' });
      return { path: '/pages/index/index' }
    }
  },
  async fetchFamilyTree(familyId) {
    try {
      const res = await request({ url: API.getFamilyTree(familyId) });
      this.setData({ activeFamilyData: res.data, isTreeLoading: false, });
    } catch (error) {
      this.setData({ isTreeLoading: false });
    }
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
