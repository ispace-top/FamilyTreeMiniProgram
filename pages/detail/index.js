// pages/detail/index.js
import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

Page({
  data: {
    memberId: null,
    userRole: 'member',
    memberInfo: null,
    relations: {}, // 用于存储家庭关系
    editableInfo: {},
    isLoading: true,
    isEditing: false,
    statusOptions: [
      { value: 'alive', text: '在世' },
      { value: 'deceased', text: '已故' }
    ],
    showAddChildModal: false,
    newChild: { name: '', gender: 'male', birth_date: '' },
    showAddSpouseModal: false,
    spouseSearchName: '',
    spouseSearchResults: [],
    newSpouse: { name: '', gender: 'male', birth_date: '' },
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        memberId: options.id,
        userRole: options.role || 'member'
      });
      this.loadPageData(options.id);
    }
  },
  
  // 封装一个统一的页面数据加载函数
  async loadPageData(id) {
    this.setData({ isLoading: true });
    try {
      // 并行发起两个请求，提升加载速度
      const [memberRes, relationsRes] = await Promise.all([
        request({ url: API.getMemberDetail(id) }),
        request({ url: API.getMemberRelations(id) })
      ]);

      const memberInfo = memberRes.data;
      if (memberInfo.birth_date) memberInfo.birth_date = memberInfo.birth_date.split('T')[0];
      if (memberInfo.death_date) memberInfo.death_date = memberInfo.death_date.split('T')[0];
      
      this.setData({ 
        memberInfo: memberInfo, 
        relations: relationsRes.data,
        isLoading: false,
        editableInfo: JSON.parse(JSON.stringify(memberInfo))
      });
      wx.setNavigationBarTitle({ title: memberInfo.name + '的详情' });
    } catch (error) {
      this.setData({ isLoading: false });
      console.error(`加载成员(id=${id})数据失败:`, error);
    }
  },

  // --- 编辑模式 ---
  toggleEditMode() {
    if (this.data.isEditing) {
      this.setData({ editableInfo: JSON.parse(JSON.stringify(this.data.memberInfo)), isEditing: false });
    } else {
      this.setData({ isEditing: true });
    }
  },
  handleInputChange(e) { this.setData({ [`editableInfo.${e.currentTarget.dataset.field}`]: e.detail.value }); },
  handlePickerChange(e) { this.setData({ [`editableInfo.status`]: this.data.statusOptions[e.detail.value].value }); },
  async handleSave() {
    if (!this.data.editableInfo.name.trim()) return wx.showToast({ title: '姓名不能为空', icon: 'none' });
    try {
      wx.showLoading({ title: '保存中...' });
      await request({ url: API.updateMember(this.data.memberId), method: 'PUT', data: this.data.editableInfo });
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.setData({ isEditing: false });
      this.loadPageData(this.data.memberId); // 重新加载所有数据
      this.notifyHomePageToRefresh();
    } catch (error) {
      wx.hideLoading();
    }
  },

  // --- 添加子女 ---
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
      this.loadPageData(this.data.memberId); // 重新加载所有数据
      this.notifyHomePageToRefresh();
    } catch (error) {
      wx.hideLoading();
    }
  },

  // --- 添加配偶 ---
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

  // --- 关系跳转 ---
  navigateToMember(e) {
    const memberId = e.currentTarget.dataset.id;
    if (!memberId) return;
    // 使用redirectTo，在当前页面栈中替换，体验更好
    wx.redirectTo({
      url: `/pages/detail/index?id=${memberId}&role=${this.data.userRole}`
    });
  },

  // --- 通用方法 ---
  notifyHomePageToRefresh() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      const prePage = pages[pages.length - 2];
      if (prePage.route === 'pages/index/index' && typeof prePage.fetchFamilyTree === 'function') {
        prePage.fetchFamilyTree(prePage.data.activeFamilyId);
      }
    }
  },
});
