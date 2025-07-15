// pages/index/index.js

// 步骤1：从我们新建的配置文件中，导入API根地址
import { API_BASE_URL } from '../../utils/config.js';

Page({
  data: {
    familyData: null, // 原始数据，用于搜索时的参照
    displayData: null, // 显示在界面上的数据，会动态变化
    searchTerm: '',
    isLoading: true, // 控制加载状态的显示
    loadError: false // 控制错误状态的显示
  },

  onLoad() {
    // 页面加载时，自动调用方法获取数据
    this.fetchFamilyTree();
  },

  /**
   * 核心函数：从API获取家族树数据
   */
  fetchFamilyTree() {
    this.setData({ isLoading: true, loadError: false });
    
    wx.request({
      // 步骤2：将API根地址和具体接口路径拼接成一个完整的URL
      url: API_BASE_URL + '/api/family/1/tree', 
      method: 'GET',
      success: (res) => {
        console.log('首页API请求成功:', res);
        // 判断网络请求和业务逻辑是否都成功
        if (res.statusCode === 200 && res.data.code === 200) {
          const data = res.data.data;
          this.setData({
            familyData: JSON.parse(JSON.stringify(data)), // 存储一份不变的原始数据
            displayData: JSON.parse(JSON.stringify(data)), // 用于显示的数据
            isLoading: false
          });
        } else {
          // 任何一个失败，都显示错误状态
          this.setData({ isLoading: false, loadError: true });
        }
      },
      fail: (err) => {
        // 网络层面的失败
        console.error('首页API请求失败:', err);
        this.setData({ isLoading: false, loadError: true });
      }
    });
  },

  /**
   * 点击“重试”按钮时调用
   */
  retryLoad() {
    this.fetchFamilyTree();
  },

  /**
   * 搜索框输入时触发
   */
  onSearchInput(e) {
    const searchTerm = e.detail.value.trim();
    // 使用函数防抖，优化性能，避免过于频繁地执行搜索
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.performSearch(searchTerm);
    }, 300); // 延迟300毫秒执行
  },

  /**
   * 执行搜索和高亮操作
   */
  performSearch(searchTerm) {
    // 如果搜索词为空，则恢复显示原始数据
    if (!searchTerm) {
      this.setData({
        displayData: JSON.parse(JSON.stringify(this.data.familyData)),
        searchTerm: ''
      });
      return;
    }
    
    // 深度拷贝一份原始数据进行处理，避免污染
    const originalData = JSON.parse(JSON.stringify(this.data.familyData));
    
    // 递归高亮匹配的成员
    const highlightedData = this.highlightMembers(originalData, searchTerm);

    this.setData({
      displayData: highlightedData,
      searchTerm: searchTerm
    });
  },

  /**
   * 递归遍历家族树，为匹配的成员添加 highlight 标记
   */
  highlightMembers(node, term) {
    if (!node) return null;

    // 检查当前成员是否匹配
    if (node.name && node.name.includes(term)) {
      node.highlight = true;
    } else {
      node.highlight = false;
    }

    // 检查配偶是否匹配
    if (node.spouse) {
      if (node.spouse.name && node.spouse.name.includes(term)) {
        node.spouse.highlight = true;
      } else {
        node.spouse.highlight = false;
      }
    }

    // 递归处理子女
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child => this.highlightMembers(child, term));
    }

    return node;
  }
});
