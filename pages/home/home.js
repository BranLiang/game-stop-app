Page({
  data: {
    showDialog: false,
    subscribeButton: {
      text: '确认关注',
      className: 'subscription-button',
      loading: false,
      disabled: false
    },
    games: [],
    isLoading: false,
    page: 1,
    hasNextPage: true,
    selectedGameIndex: 0,
    showFilterDialog: false,
    isSearching: false,
    filters: [{
        text: "所有区",
        value: "zone:all"
      },
      {
        text: "德服",
        value: "zone:de-de"
      },
      {
        text: "美服",
        value: "zone:en-us"
      },
      {
        text: "港服",
        value: "zone:en-hk"
      },
      {
        text: "我的关注",
        value: "relation:subscription"
      }
    ],
    selectedFilterIndex: 0,
    inputShowed: false,
    inputVal: "",
    lastSearchedAt: 0
  },
  onLoad: function({
    gameName
  }) {
    this.setData({
      inputVal: gameName ? gameName.replace(/\+/g, " ") : ''
    }, () => this.fetchDate(this))
  },
  fetchDate: function(homePage) {
    homePage.setData({
      isLoading: true
    }, () => wx.request({
      method: 'GET',
      url: 'https://game.corran.cn/api/games.json',
      header: {
        "x-corran-token": getApp().globalData.openid
      },
      data: {
        "q": this.data.inputVal,
        "filter": this.data.filters[this.data.selectedFilterIndex].value,
        "page": this.data.page
      },
      success: function({
        data
      }) {
        const games = data['data']
        const hasNextPage = data['pagination']['has_next_page']
        homePage.setData({
          hasNextPage: hasNextPage,
          games: homePage.data.games.concat(games),
          page: homePage.data.page + 1,
          isLoading: false
        })
      }
    }))
  },
  onPullDownRefresh: function() {
    this.reFetchData(this, () => {
      wx.stopPullDownRefresh()
    }, false)
  },
  reFetchData: function(homePage, callback, isLoading = true) {
    homePage.setData({
      isLoading: isLoading
    }, () => wx.request({
      method: 'GET',
      url: 'https://game.corran.cn/api/games.json',
      header: {
        "x-corran-token": getApp().globalData.openid
      },
      data: {
        "q": this.data.inputVal,
        "filter": this.data.filters[this.data.selectedFilterIndex].value,
        "page": 1
      },
      success: function({
        data
      }) {
        const games = data['data']
        const hasNextPage = data['pagination']['has_next_page']
        homePage.setData({
          hasNextPage: hasNextPage,
          games: games,
          page: homePage.data.page + 1,
          isLoading: false
        }, callback)
      }
    }))
  },
  onReachBottom: function() {
    this.fetchDate(this)
  },
  showFilter: function() {
    this.setData({
      showFilterDialog: true
    })
  },
  filterGames: function({
    detail
  }) {
    this.setData({
      showFilterDialog: false,
      selectedFilterIndex: detail.index,
      page: 1,
      hasNextPage: true,
      games: []
    }, () => this.fetchDate(this))
  },
  clearInput: function() {
    this.setData({
      inputVal: ""
    }, () => this.reFetchData(this));
  },
  inputTyping: function(e) {
    this.setData({
      inputVal: e.detail.value
    })
  },
  search: function() {
    this.setData({
      isSearching: true
    }, () => this.reFetchData(this, () => {
      this.setData({
        isSearching: false
      })
    }))
  },
  selectGame: function({
    currentTarget
  }) {
    const game = this.data.games[currentTarget.dataset.gameIndex];
    this.setData({
      showDialog: true,
      selectedGameIndex: currentTarget.dataset.gameIndex,
      subscribeButton: {
        text: game.subscribed ? '取消关注' : '确认关注',
        className: game.subscribed ? 'subscribed-button' : 'subscription-button',
        loading: false,
        disabled: false
      }
    })
  },
  unsubscribe: function() {
    const homePage = this;
    const game = this.data.games[this.data.selectedGameIndex];
    homePage.setData({
      subscribeButton: {
        ...homePage.data.subscribeButton,
        text: '',
        loading: true,
        disabled: true
      }
    })
    wx.request({
      method: 'POST',
      url: `https://game.corran.cn/api/games/${game.id}/unsubscribe`,
      header: {
        "x-corran-token": getApp().globalData.openid
      },
      success: function ({
        statusCode
      }) {
        if (statusCode == 200) {
          homePage.setData({
            subscribeButton: {
              text: '确认关注',
              className: 'subscription-button',
              loading: false,
              disabled: false
            },
            games: homePage.data.games.map(g => {
              if (g.id == game.id) {
                return {
                  ...game,
                  subscribed: false
                }
              } else {
                return g
              }
            })
          })
        }
      }
    })
  },
  subscribe: function() {
    const homePage = this;
    const game = this.data.games[this.data.selectedGameIndex];
    if (game.subscribed) {
      this.unsubscribe();
      return
    }
    homePage.setData({
      subscribeButton: {
        ...homePage.data.subscribeButton,
        text: '',
        loading: true,
        disabled: true
      }
    })
    wx.requestSubscribeMessage({
      tmplIds: [
        'mlWhs1zwgyoyRWRT6f3k8HQgQmfr23BWIvQNMb36OWc',
        'wr4GgpPIeb0GLlfbzcyi5QVjhfq3WHsqBLaobPNtvhk'
      ],
      success: function(res) {
        var sendWelcome = "no"
        if (res['mlWhs1zwgyoyRWRT6f3k8HQgQmfr23BWIvQNMb36OWc'] == 'accept') {
          sendWelcome = "yes"
        }
        if (res['wr4GgpPIeb0GLlfbzcyi5QVjhfq3WHsqBLaobPNtvhk'] == 'accept') {
          wx.request({
            method: 'POST',
            url: `https://game.corran.cn/api/games/${game.id}/subscribe`,
            data: {
              "send_welcome": sendWelcome
            },
            header: {
              "x-corran-token": getApp().globalData.openid
            },
            success: function({
              statusCode
            }) {

              if (statusCode == 200) {
                homePage.setData({
                  subscribeButton: {
                    text: '取消关注',
                    className: 'subscribed-button',
                    loading: false,
                    disabled: false
                  },
                  games: homePage.data.games.map(g => {
                    if (g.id == game.id) {
                      return {
                        ...game,
                        subscribed: true
                      }
                    } else {
                      return g
                    }
                  })
                })
              }
            }
          })
        } else {
          homePage.setData({
            subscribeButton: {
              ...homePage.data.subscribeButton,
              text: '确认关注',
              loading: false,
              disabled: false
            }
          })
        }
      }
    })

  }
})