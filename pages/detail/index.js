import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

const app = getApp();

Page({
  data: {
    memberId: null,
    userRole: 'member',
    memberInfo: null,
    relations: {},
    editableInfo: {},
    isLoading: true,
    isEditing: false,
    isSelf: false,
    canClaim: false,
    canEdit: false, // 新增：综合判断是否可编辑
    statusOptions: [
      { value: 'alive', text: '在世' },
      { value: 'deceased', text: '已故' }
    ],
    // ... (其他弹窗相关data保持不变)
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
  
  async loadPageData(id) {
    this.setData({ isLoading: true });
    try {
      const [memberRes, relationsRes] = await Promise.all([
        request({ url: API.getMemberDetail(id) }),
        request({ url: API.getMemberRelations(id) })
      ]);

      const memberInfo = memberRes.data;
      const relations = relationsRes.data;
      if (memberInfo.birth_date) memberInfo.birth_date = memberInfo.birth_date.split('T')[0];
      if (memberInfo.death_date) memberInfo.death_date = memberInfo.death_date.split('T')[0];
      
      const families = app.globalData.families || [];
      const currentFamilyRelation = families.find(f => f.id === memberInfo.family_id);
      const selfMemberId = currentFamilyRelation ? currentFamilyRelation.member_id : null;
      
      const isSelf = selfMemberId == id;
      const canClaim = !selfMemberId && !memberInfo.is_linked;

      // 核心逻辑：判断当前用户是否有编辑权限
      let canEdit = false;
      if (this.data.userRole === 'admin' || this.data.userRole === 'editor' || isSelf) {
        canEdit = true;
      } else if (selfMemberId) {
        // 判断是否为自己的配偶
        if (relations.spouse && relations.spouse.id == selfMemberId) {
            canEdit = true;
        }
        // 判断是否为自己的子女
        if (memberInfo.father_id == selfMemberId || memberInfo.mother_id == selfMemberId) {
            canEdit = true;
        }
      }
      
      this.setData({ 
        memberInfo: memberInfo, 
        relations: relations,
        isLoading: false,
        isSelf: isSelf,
        canClaim: canClaim,
        canEdit: canEdit, // 更新编辑权限状态
        editableInfo: JSON.parse(JSON.stringify(memberInfo))
      });
      wx.setNavigationBarTitle({ title: memberInfo.name + '的详情' });
    } catch (error) {
      this.setData({ isLoading: false });
    }
  },

  async handleClaimProfile() {
    wx.showLoading({ title: '正在绑定...' });
    try {
        await request({
            url: API.claimMember(this.data.memberInfo.family_id),
            method: 'PUT',
            data: {
                memberId: this.data.memberId
            }
        });
        wx.hideLoading();
        wx.showToast({ title: '绑定成功', icon: 'success' });
        
        await app.loadUserFamilies();
        this.loadPageData(this.data.memberId);

    } catch (error) {
        wx.hideLoading();
    }
  },

  // --- 其他函数保持不变 ---
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
      this.loadPageData(this.data.memberId);
      this.notifyHomePageToRefresh();
    } catch (error) {
      wx.hideLoading();
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
  navigateToMember(e) {
    const memberId = e.currentTarget.dataset.id;
    if (!memberId) return;
    wx.redirectTo({
      url: `/pages/detail/index?id=${memberId}&role=${this.data.userRole}`
    });
  },
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
