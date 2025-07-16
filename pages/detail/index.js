// pages/detail/index.js
import { API } from '../../utils/config.js'; // 引入API配置

Page({
  // ... data 部分保持不变 ...
  onLoad(options) { if (options.id) { this.fetchMemberDetail(options.id); } },
  fetchMemberDetail(id) {
    // ...
    wx.request({
      url: API.getMemberDetail(id), // <-- 修改这里
      // ... 其他部分保持不变 ...
    });
  }
});