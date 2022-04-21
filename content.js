'use strict'
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  let userNames = []
  let getUserNames = function () {
    // meetsでユーザーがリスト表示されているクラス
    let users = document.getElementsByClassName('zWGUib')
    for (let index = 0; index < users.length; index++) {
      const user = users[index]
      let userName = user.textContent
      userName = userName.replace('さん', '')
      userName = userName.replace('（', '(')
      userName = userName.split(' (')[0]
      userNames.push(userName)
    }
  }

  let isOpend = false
  const iconElements = $('.P9KVBf .JsuyRc[aria-pressed="true"] .Mwv9k')
  if (iconElements.length) {
    isOpend = iconElements[0].innerHTML == "people_alt"
  }
  if (!isOpend) {
    // ユーザーリストが開かれていなければ、開く
    document.getElementsByClassName('VfPpkd-Bz112c-LgbsSe yHy1rc eT1oJ JsuyRc boDUxc')[1].click()
  }

  const scrollSelection = '.ggUFBf.Ze1Fpc' // スペース禁止
  // スクロールトップに移動しておく
  $(scrollSelection).scrollTop(0)

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
    $(scrollSelection).scrollTop(move * index)
    index++
  }, 100)

  return true
})
