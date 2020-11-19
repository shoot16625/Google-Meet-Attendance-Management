'use strict'
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  let userNames = []
  let getUserNames = function () {
    // meetsでユーザーがリスト表示されているクラス
    let users = document.getElementsByClassName('ZjFb7c')
    for (let index = 0; index < users.length; index++) {
      const user = users[index]
      let userName = user.textContent
      userName = userName.replace('さん', '')
      userName = userName.replace('（', '(')
      userName = userName.split(' (')[0]
      userNames.push(userName)
    }
  }
  // ユーザーのリストを表示する
  document.getElementsByClassName('gV3Svc')[0].click()
  // スクロールトップに移動しておく
  $('.HALYaf').scrollTop(0)

  // 200人くらい取れる？
  const move = 400
  let index = 0
  let userNum = 0
  let ended = 0
  let id = setInterval(function () {
    userNum = userNames.length
    getUserNames()
    // 重複削除
    userNames = Array.from(new Set(userNames))
    if (userNum === userNames.length) {
      // 4回連続でuserNamesが変わらなかったら終了
      ended++
    }
    if (index >= 30 || ended === 4) {
      clearInterval(id) //idをclearIntervalで指定している
      sendResponse(userNames)
    }
    $('.HALYaf').scrollTop(move * index)
    index++
  }, 100)

  return true
})
