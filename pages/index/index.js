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
    activeFamily: null, // 保存完整的当前家族对象
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
  
  // 使用 onShow 确保每次返回页面都能刷新数据
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
    this.setData({ families: families, isLoading: false });

    if (families && families.length > 0) {
      // 尝试在更新后的列表中找到当前激活的家族
      let currentActiveFamily = families.find(f => f.id === this.data.activeFamilyId);
      
      // 如果找不到（比如被删了），则默认选中第一个
      if (!currentActiveFamily) {
        currentActiveFamily = families[0];
      }
      
      // 统一调用 switchFamily 来刷新所有状态
      this.switchFamily(currentActiveFamily);

    } else {
      // 如果所有家族都被删除了
      this.setData({ activeFamilyId: null, activeFamily: null, activeFamilyData: null });
      wx.setNavigationBarTitle({ title: '清风族谱' });
    }
  },

  switchFamily(family) {
    if (!family) return;
    // 即使是同一个家族，也需要更新一下activeFamily的数据，以防信息被修改
    if (family.id === this.data.activeFamilyId) {
        this.setData({ activeFamily: family });
        wx.setNavigationBarTitle({ title: family.name });
        return;
    }
    
    this.setData({
      activeFamilyId: family.id,
      activeFamily: family,
      activeFamilyData: null,
      isTreeLoading: true,
      currentUserRole: family.role,
    });
    wx.setNavigationBarTitle({ title: family.name });
    this.fetchFamilyTree(family.id);
  },
  
  switchFamilyBySheet() {
    const familyNames = this.data.families.map(f => f.name);
    wx.showActionSheet({
      itemList: familyNames,
      success: (res) => {
        const selectedFamily = this.data.families[res.tapIndex];
        this.switchFamily(selectedFamily);
      }
    });
  },

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

  navigateToFamilyIntro() {
    const activeFamily = this.data.activeFamily;
    if (!activeFamily) return;

    wx.navigateTo({
      url: `/pages/family-intro/index?familyId=${activeFamily.id}&familyName=${activeFamily.name}&userRole=${this.data.currentUserRole}`
    });
  },
  navigateToFamilySettings() {
    const activeFamily = this.data.activeFamily;
    if (!activeFamily) return;
    wx.navigateTo({
      url: `/pages/family-settings/index?familyId=${activeFamily.id}&familyName=${activeFamily.name}&familyDesc=${activeFamily.description || ''}&familyIntro=${activeFamily.introduction || ''}&avatarUrl=${activeFamily.avatar || ''}&bannerUrl=${activeFamily.banner || ''}`
    });
  },
  navigateToManagement() {
    const activeFamily = this.data.activeFamily;
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
    const familyName = this.data.activeFamily ? this.data.activeFamily.name : '我的家族';
    return {
      title: `邀请您加入「${familyName}」`,
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
