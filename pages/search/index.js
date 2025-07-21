// pages/search/index.js
import { API } from '../../utils/config.js';
import request from '../../utils/request.js';

Page({
  data: {
    familyId: null,
    userRole: 'member',
    keyword: '',
    results: [],
    isLoading: false,
    hasSearched: false, // 是否已经执行过至少一次搜索
  },

  onLoad(options) {
    // 接收从首页传来的家族ID和用户角色
    if (options.familyId) {
      this.setData({ 
        familyId: options.familyId,
        userRole: options.role || 'member'
      });
    }
  },

  // 处理搜索框输入
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });

    // 使用函数防抖，避免过于频繁地请求API
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.performSearch(keyword);
    }, 500); // 延迟500毫秒
  },

  // 执行搜索
  async performSearch(keyword) {
    if (!keyword.trim()) {
      this.setData({ results: [], hasSearched: false });
      return;
    }

    this.setData({ isLoading: true, hasSearched: true });

    try {
      const res = await request({
        url: API.searchAllMembers(this.data.familyId, keyword)
      });
      this.setData({ results: res.data, isLoading: false });
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({ isLoading: false });
    }
  },

  // 跳转到成员详情页
  navigateToDetail(e) {
    const memberId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/index?id=${memberId}&role=${this.data.userRole}`
    });
  },

  // 点击取消按钮，返回上一页
  navigateBack() {
    wx.navigateBack();
  }
});
