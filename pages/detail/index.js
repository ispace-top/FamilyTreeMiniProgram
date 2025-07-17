// pages/detail/index.js
import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

Page({
  data: {
    memberId: null,
    userRole: 'member',
    memberInfo: null,
    editableInfo: {},
    isLoading: true,
    isEditing: false,
    statusOptions: [
      { value: 'alive', text: '在世' },
      { value: 'deceased', text: '已故' }
    ],

    // 添加子女弹窗相关
    showAddChildModal: false,
    newChild: {
      name: '',
      gender: 'male',
      birth_date: ''
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        memberId: options.id,
        userRole: options.role || 'member'
      });
      this.fetchMemberDetail(options.id);
    }
  },

  async fetchMemberDetail(id) {
    this.setData({ isLoading: true });
    try {
      const res = await request({ url: API.getMemberDetail(id) });
      if (res.data.birth_date) res.data.birth_date = res.data.birth_date.split('T')[0];
      if (res.data.death_date) res.data.death_date = res.data.death_date.split('T')[0];
      this.setData({ 
        memberInfo: res.data, 
        isLoading: false,
        editableInfo: JSON.parse(JSON.stringify(res.data))
      });
      wx.setNavigationBarTitle({ title: res.data.name + '的详情' });
    } catch (error) {
      this.setData({ isLoading: false });
      console.error(`获取成员(id=${id})详情失败:`, error);
    }
  },

  // --- 编辑模式相关 ---
  toggleEditMode() {
    if (this.data.isEditing) {
      this.setData({ editableInfo: JSON.parse(JSON.stringify(this.data.memberInfo)), isEditing: false });
    } else {
      this.setData({ isEditing: true });
    }
  },
  handleInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`editableInfo.${field}`]: e.detail.value });
  },
  handlePickerChange(e) {
    const field = e.currentTarget.dataset.field;
    let value;
    if (field === 'status') value = this.data.statusOptions[e.detail.value].value;
    this.setData({ [`editableInfo.${field}`]: value });
  },
  async handleSave() {
    if (!this.data.editableInfo.name.trim()) return wx.showToast({ title: '姓名不能为空', icon: 'none' });
    try {
      wx.showLoading({ title: '保存中...' });
      await request({ url: API.updateMember(this.data.memberId), method: 'PUT', data: this.data.editableInfo });
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.setData({ isEditing: false });
      this.fetchMemberDetail(this.data.memberId);
      const pages = getCurrentPages();
      if (pages.length > 1) {
        const prePage = pages[pages.length - 2];
        if (typeof prePage.fetchFamilyTree === 'function') {
          prePage.fetchFamilyTree(prePage.data.activeFamilyId);
        }
      }
    } catch (error) {
      wx.hideLoading();
      console.error('更新成员信息失败:', error);
    }
  },

  // --- 添加子女相关 ---
  showAddChildModal() {
    this.setData({ showAddChildModal: true });
  },
  hideAddChildModal() {
    this.setData({ showAddChildModal: false, newChild: { name: '', gender: 'male', birth_date: '' } });
  },
  onChildNameInput(e) { this.setData({ 'newChild.name': e.detail.value }); },
  onChildGenderChange(e) { this.setData({ 'newChild.gender': e.detail.value }); },
  onChildBirthDateInput(e) { this.setData({ 'newChild.birth_date': e.detail.value }); },
  
  async handleCreateChild() {
    const { name, gender, birth_date } = this.data.newChild;
    const parent = this.data.memberInfo;
    if (!name.trim()) return wx.showToast({ title: '姓名不能为空', icon: 'none' });

    // 准备要提交的数据
    const postData = { name, gender, birth_date };
    if (parent.gender === 'male') {
      postData.father_id = parent.id;
    } else {
      postData.mother_id = parent.id;
    }

    try {
      wx.showLoading({ title: '添加中...' });
      await request({
        url: API.createMember(parent.family_id),
        method: 'POST',
        data: postData
      });
      wx.hideLoading();
      this.hideAddChildModal();
      wx.showToast({ title: '添加成功！', icon: 'success' });

      // 通知首页刷新整个族谱树
      const pages = getCurrentPages();
      if (pages.length > 1) {
        const prePage = pages[pages.length - 2];
        if (typeof prePage.fetchFamilyTree === 'function') {
          prePage.fetchFamilyTree(prePage.data.activeFamilyId);
        }
      }
    } catch (error) {
      wx.hideLoading();
      console.error('添加子女失败:', error);
    }
  }
});
