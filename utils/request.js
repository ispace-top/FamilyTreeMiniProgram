// utils/request.js

// 导入我们的API配置
import { API } from './config.js';

/**
 * 封装一个统一的wx.request请求函数
 * @param {object} options - wx.request的参数对象
 * @returns {Promise}
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 从本地存储中获取token
    const token = wx.getStorageSync('token');
    
    // 统一设置请求头
    const header = {
      ...options.header, // 保留调用时传入的header
      'Content-Type': 'application/json',
    };

    // 如果token存在，则添加到Authorization请求头中
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      ...options, // 合并传入的参数
      header, // 使用我们统一设置的header
      success(res) {
        // 对返回结果进行初步处理
        if (res.statusCode === 200 || res.statusCode === 201) {
          // 业务逻辑成功
          if (res.data.code === 200 || res.data.code === 201) {
            resolve(res.data); // 返回data部分
          } else {
            // 业务逻辑失败，如“名称已存在”
            wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
            reject(res.data);
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          // 认证失败或Token过期
          wx.showToast({ title: '请先登录', icon: 'none' });
          // 这里可以引导用户重新登录
          // getApp().doLogin(); 
          reject(res);
        } else {
          // 其他HTTP错误
          wx.showToast({ title: `请求错误 ${res.statusCode}`, icon: 'none' });
          reject(res);
        }
      },
      fail(err) {
        // 网络层面的失败
        wx.showToast({ title: '网络请求失败', icon: 'none' });
        reject(err);
      }
    });
  });
};

// 将封装好的request函数导出
export default request;
