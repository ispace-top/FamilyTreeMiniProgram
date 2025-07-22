// utils/request.js

import { API } from './config.js';

/**
 * 封装一个统一的wx.request请求函数
 * @param {object} options - wx.request的参数对象
 * @returns {Promise}
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    const header = {
      ...options.header,
      'Content-Type': 'application/json',
    };

    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      ...options,
      header,
      success(res) {
        // 对返回结果进行分类处理
        if (res.statusCode === 200 || res.statusCode === 201) {
          // 业务逻辑成功
          if (res.data.code === 200 || res.data.code === 201) {
            resolve(res.data);
          } else {
            // 业务逻辑失败 (例如，后端主动返回的错误)
            wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
            reject(res.data);
          }
        } else if (res.statusCode === 401) {
          // 401 未认证，通常是token问题
          wx.showToast({ title: '请先登录', icon: 'none' });
          reject(res.data);
        } else if (res.statusCode === 403) {
          // 403 禁止访问，通常是权限问题
          // 优先使用后端返回的详细错误信息
          wx.showToast({ title: res.data.message || '您没有权限执行此操作', icon: 'none', duration: 2000 });
          reject(res.data);
        } else {
          // 其他HTTP错误
          wx.showToast({ title: `请求错误 ${res.statusCode}`, icon: 'none' });
          reject(res.data);
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

export default request;
