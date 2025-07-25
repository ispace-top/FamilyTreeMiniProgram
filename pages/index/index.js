// pages/index/index.js
import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

const app = getApp();

Page({
  data: {
    // --- 页面状态 ---
    isLoading: true,
    isTreeLoading: false,

    // --- 数据存储 ---
    families: [],
    activeFamilyId: null,
    activeFamily: null,
    activeFamilyData: null,
    currentUserRole: 'member',

    // --- 弹窗控制 ---
    showModal: false,
    newFamilyName: '',
    newFamilyDesc: '',
    showAddMemberModal: false,
    newMember: {
      name: '',
      gender: 'male',
    },
    statusBarHeight: app.globalData.statusBarHeight,
    navBarHeight: app.globalData.navBarHeight,
  },

  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
    });
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    console.warn(`statusBar=${this.data.statusBarHeight};   navBar=${this.data.navBarHeight}`)
  },

  // 【恢复】使用您项目原有的 onShow 逻辑，通过回调函数等待 app.js 加载数据
  onShow() {
    if (app.globalData.families) {
      this.handleFamiliesLoaded(app.globalData.families);
    } else {
      // 设置一个回调，当 app.js 中的 loadUserFamilies 完成后，会调用这个函数
      app.userFamiliesReadyCallback = (families) => {
        this.handleFamiliesLoaded(families);
      };
    }
  },

  // 【恢复】您项目原有的处理家族数据加载完成的函数
  handleFamiliesLoaded(families) {
    this.setData({ families: families, isLoading: false });

    if (families && families.length > 0) {
      let currentActiveFamily = families.find(f => f.id === this.data.activeFamilyId);
      if (!currentActiveFamily) {
        currentActiveFamily = families[0];
      }
      this.switchFamily(currentActiveFamily);
    } else {
      this.setData({ activeFamilyId: null, activeFamily: null, activeFamilyData: null });
    }
  },

  // 【恢复】您项目原有的切换家族函数
  switchFamily(family) {
    if (!family) return;

    this.setData({
      activeFamilyId: family.id,
      activeFamily: family,
      activeFamilyData: null,
      isTreeLoading: true,
      currentUserRole: family.role,
    });

    this.fetchFamilyTree(family.id);
  },

  // 【恢复】您项目原有的获取族谱树的函数，它正确地使用了 request.js
  async fetchFamilyTree(familyId) {
    try {
      const res = await request({ url: API.getFamilyTree(familyId) });
      this.setData({ activeFamilyData: res.data, isTreeLoading: false, });
    } catch (error) {
      this.setData({ isTreeLoading: false });
    }
  },

  // --- 界面交互函数（与原始代码保持一致） ---

  switchFamilyBySheet() {
    const familyNames = this.data.families.map(f => f.name);
    if (familyNames.length <= 1) return;
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
        if (itemList[tapIndex] === '邀请成员') this.onShareAppMessage();
        else if (itemList[tapIndex] === '创建新家族') this.showCreateFamilyModal();
        else if (itemList[tapIndex] === '成员管理') this.navigateToManagement();
        else if (itemList[tapIndex] === '家族设置') this.navigateToFamilySettings();
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
    const { activeFamily } = this.data;
    if (!activeFamily) return;
    const params = `familyId=${activeFamily.id}&familyName=${activeFamily.name}&familyDesc=${activeFamily.description || ''}&avatarUrl=${activeFamily.avatar || ''}&bannerUrl=${activeFamily.banner || ''}`;
    wx.navigateTo({ url: `/pages/family-settings/index?${params}` });
  },

  navigateToManagement() {
    const activeFamily = this.data.activeFamily;
    if (!activeFamily) return;
    wx.navigateTo({ url: `/pages/management/index?familyId=${activeFamily.id}&familyName=${activeFamily.name}` });
  },

  navigateToSearch() {
    if (!this.data.activeFamilyId) return;
    wx.navigateTo({ url: `/pages/search/index?familyId=${this.data.activeFamilyId}&role=${this.data.currentUserRole}` });
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

  showCreateFamilyModal() { this.setData({ showModal: true }); },
  hideCreateFamilyModal() { this.setData({ showModal: false, newFamilyName: '', newFamilyDesc: '' }); },
  async handleCreateFamily() {
    if (!this.data.newFamilyName.trim()) { return wx.showToast({ title: '家族名称不能为空', icon: 'none' }); }
    wx.showLoading({ title: '创建中...' });
    try {
      await request({ url: API.createFamily, method: 'POST', data: { name: this.data.newFamilyName, description: this.data.newFamilyDesc } });
      await app.loadUserFamilies(); // 重新加载全局家族列表
    } catch (error) {
      // request中已统一处理错误提示
    } finally {
      wx.hideLoading();
      this.hideCreateFamilyModal();
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
    wx.showLoading({ title: '添加中...' });
    try {
      await request({ url: API.createMember(familyId), method: 'POST', data: { name, gender } });
      wx.showToast({ title: '添加成功！', icon: 'success' });
      this.fetchFamilyTree(familyId);
    } catch (error) {
      // request中已统一处理错误提示
    } finally {
      wx.hideLoading();
      this.hideAddMemberModal();
    }
  },

  showAddChildModal() { this.setData({ showAddChildModal: true }); },
  hideAddChildModal() { this.setData({ showAddChildModal: false, newChild: { name: '', gender: 'male', birth_date: '' } }); },
  onChildNameInput(e) { this.setData({ 'newChild.name': e.detail.value }); },
  onChildGenderChange(e) { this.setData({ 'newChild.gender': e.detail.value }); },
  onChildBirthDateInput(e) { this.setData({ 'newChild.birth_date': e.detail.value }); },
  async handleCreateChild() {
    const { name, gender, birth_date } = this.data.newChild;
    const parent = this.data.memberInfo;
    if (!name.trim()) return wx.showToast({ title: '姓名不能为空', icon: 'none' });
    const postData = { name, gender, birth_date };
    if (parent.gender === 'male') postData.father_id = parent.id;
    else postData.mother_id = parent.id;
    try {
      wx.showLoading({ title: '添加中...' });
      await request({ url: API.createMember(parent.family_id), method: 'POST', data: postData });
      wx.hideLoading();
      this.hideAddChildModal();
      wx.showToast({ title: '添加成功！', icon: 'success' });
      this.loadPageData(this.data.memberId);
      this.notifyHomePageToRefresh();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: `添加失败！\n ${error}`, icon: 'error' });
      console.error(error)
    }
  },
  showAddSpouseModal() { this.setData({ showAddSpouseModal: true, newSpouse: { name: '', gender: this.data.memberInfo.gender === 'male' ? 'female' : 'male', birth_date: '' } }); },
  hideAddSpouseModal() { this.setData({ showAddSpouseModal: false, spouseSearchName: '', spouseSearchResults: [] }); },
  onSpouseSearchInput(e) {
    const name = e.detail.value;
    this.setData({ spouseSearchName: name });
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.searchSpouse(name); }, 500);
  },
  async searchSpouse(name) {
    if (!name.trim()) return this.setData({ spouseSearchResults: [] });
    try {
      const res = await request({ url: API.searchMembers(this.data.memberInfo.family_id, name, this.data.memberId) });
      this.setData({ spouseSearchResults: res.data });
    } catch (error) {
      console.error('搜索配偶失败:', error);
    }
  },
  async handleSelectSpouse(e) {
    const selectedSpouse = e.currentTarget.dataset.spouse;
    try {
      wx.showLoading({ title: '关联中...' });
      await request({ url: API.linkSpouse(this.data.memberId), method: 'PUT', data: { spouseId: selectedSpouse.id } });
      wx.hideLoading();
      this.hideAddSpouseModal();
      wx.showToast({ title: '关联成功', icon: 'success' });
      this.loadPageData(this.data.memberId);
      this.notifyHomePageToRefresh();
    } catch (error) {
      wx.hideLoading();
    }
  },
  onNewSpouseInput(e) { this.setData({ [`newSpouse.${e.currentTarget.dataset.field}`]: e.detail.value }); },
  async handleCreateAndLinkSpouse() {
    const { name, gender, birth_date } = this.data.newSpouse;
    if (!name.trim()) return wx.showToast({ title: '姓名不能为空', icon: 'none' });
    try {
      wx.showLoading({ title: '正在创建...' });
      const createRes = await request({ url: API.createMember(this.data.memberInfo.family_id), method: 'POST', data: { name, gender, birth_date } });
      const newSpouseId = createRes.data.id;
      wx.showLoading({ title: '正在关联...' });
      await request({ url: API.linkSpouse(this.data.memberId), method: 'PUT', data: { spouseId: newSpouseId } });
      wx.hideLoading();
      this.hideAddSpouseModal();
      wx.showToast({ title: '操作成功', icon: 'success' });
      this.loadPageData(this.data.memberId);
      this.notifyHomePageToRefresh();
    } catch (error) {
      wx.hideLoading();
    }
  },
});
