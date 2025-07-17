// components/member-card/member-card.js
Component({
  properties: {
    member: {
      type: Object,
      value: null
    },
    // 新增：接收从父级传来的用户角色
    userRole: {
      type: String,
      value: 'member' // 默认是普通成员
    }
  },
  data: {
    isCollapsed: false
  },
  methods: {
    toggleCollapse(e) {
      // 阻止事件冒泡，避免点击 +/- 时触发跳转
      e.stopPropagation(); 
      this.setData({
        isCollapsed: !this.data.isCollapsed
      });
    },
    
    // 点击卡片本身，执行页面跳转
    onCardTap(e) {
      const memberId = e.currentTarget.dataset.id;
      if (!memberId) return;

      // 直接使用从 properties 中获取到的角色信息
      const userRole = this.properties.userRole;

      console.log(`即将跳转到详情页, 成员ID:${memberId}, 用户角色:${userRole}`);
      wx.navigateTo({
        url: `/pages/detail/index?id=${memberId}&role=${userRole}`
      });
    }
  }
})
