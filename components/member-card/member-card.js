// components/member-card/member-card.js
Component({
  properties: {
    member: { type: Object, value: null }
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

      console.log("即将跳转到详情页, 成员ID:", memberId);
      wx.navigateTo({
        url: `/pages/detail/index?id=${memberId}`
      });
    }
  }
})