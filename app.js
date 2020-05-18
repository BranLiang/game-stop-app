App({
  globalData: {
    openid: ''
  },
  onLaunch: function ({ scene }) {
    if (scene == 1129) {
      this.globalData.openid = 'mpcrawler';
    }
  }
})
