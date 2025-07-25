// components/member-card/member-card.js
Component({
  properties: {
    member: {
      type: Object,
      value: null
    },
    userRole: { // 接收 userRole
      type: String,
      value: 'guest'
    }
  },

  data: {
    isCollapsed: false,
  },

  methods: {
    toggleCollapse() {
      this.setData({
        isCollapsed: !this.data.isCollapsed
      });
    },

    onCardTap(e) {
      const memberId = e.currentTarget.dataset.id;
      if (!memberId) return;
      const userRole = this.properties.userRole;
      console.log(`即将跳转到详情页, 成员ID:${memberId}, 用户角色:${userRole}`);
      wx.navigateTo({
        url: `/pages/detail/index?id=${memberId}&role=${userRole}`
      });
    },

    // 长按卡片，显示成员操作表
    onCardLongPress(e) {
      const currentUserRole = this.data.userRole;
      const memberId = e.currentTarget.dataset.id;
      const memberName = this.data.member.name;
      if (currentUserRole === 'admin' || currentUserRole === 'editor') {
        wx.showActionSheet({
          itemList: ['添加配偶', '添加子女'],
          success: (res) => {
            switch (res.tapIndex) {
              case 0: // 添加配偶
                  this.triggerEvent('addSpouse', { memberId: memberId, memberName: memberName });
                break;
              case 1: // 添加子女
                this.triggerEvent('addChild', { memberId: memberId, memberName: memberName });
                break;
            }
          },
          fail(res) {
            console.log(res.errMsg)
          }
        });
      }
    },
  }
})
