// pages/detail/index.js

// 同样，先导入API根地址
import { API_BASE_URL } from '../../utils/config.js';

Page({
  data: {
    memberInfo: null, // 用于存储成员的详细信息
    isLoading: true
  },
  onLoad(options) {
    // 页面加载时，从options中获取上一个页面传来的id
    if (options.id) {
      this.fetchMemberDetail(options.id);
    }
  },

  /**
   * 根据ID获取单个成员的详细信息
   */
  fetchMemberDetail(id) {
    this.setData({ isLoading: true });
    wx.request({
      // 使用模板字符串拼接出动态的URL，如 /api/member/3
      url: API_BASE_URL + `/api/member/${id}`, 
      method: 'GET',
      success: (res) => {
        console.log(`详情页API(id=${id})请求成功:`, res);
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({ memberInfo: res.data.data, isLoading: false });
          // 动态设置页面的标题为成员姓名
          wx.setNavigationBarTitle({
            title: res.data.data.name + '的详情'
          });
        } else {
          this.setData({ isLoading: false });
          wx.showToast({ title: '获取信息失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error(`详情页API(id=${id})请求失败:`, err);
        this.setData({ isLoading: false });
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    })
  }
});
