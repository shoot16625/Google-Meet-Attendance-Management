let confirmButton = document.getElementById('confirm-button')

confirmButton.onclick = function () {
  // 現在出席しているユーザを取得
  let attendingUsers = []
  waitPageLoad((currentTab) => {
    chrome.tabs.sendMessage(currentTab.id, 'send to content.js', function (
      item
    ) {
      attendingUsers = item

      // calender api
      chrome.identity.getAuthToken({ interactive: true }, function (token) {
        let init = {
          method: 'GET',
          async: true,
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          contentType: 'json'
        }
        // 予定を含有してないとダメ
        // const params = {
        //   timeMin: '2020-07-06T00:59:59.000+09:00',
        //   timeMax: '2020-07-06T23:39:59.000+09:00'
        // }
        let from_date = new Date()
        let to_date = new Date()
        from_date.setHours(from_date.getHours() - 5)
        to_date.setHours(to_date.getHours() + 5)
        const params = {
          timeMin: from_date.toISOString(),
          timeMax: to_date.toISOString()
        }
        const queryString = Object.keys(params)
          .map((name) => `${name}=${encodeURIComponent(params[name])}`)
          .join('&')

        chrome.tabs.query({active: true}, (tabs) => {
          // 現在のタブを取得(複数取得される場合もある)
          for (let index = 0; index < tabs.length; index++) {
            const tab = tabs[index]
            if (tab.hasOwnProperty('url')){
              targetHangoutLink = tab.url.split('?')[0]
              break
            }
          }

          // 出席予定者をcalenderから取得
          let attendees = []
          let attendeesName = {}
          fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?' +
              queryString +
              '&key=change-your-API-key',
            init
          )
            .then((response) => response.json())
            .then(function (data) {
              for (let index = 0; index < data.items.length; index++) {
                const item = data.items[index]
                if (
                  item.hangoutLink === targetHangoutLink &&
                  item.attendees !== undefined
                ) {
                  item.attendees.forEach((user) => {
                    // 出席予定のユーザ, 未回答ユーザも含める
                    if (
                      user.responseStatus === 'accepted' ||
                      user.responseStatus === 'needsAction'
                    ) {
                      attendees.push(user.email)
                      if (user.displayName) {
                        // アカウント名設定があれば
                        attendeesName[
                          user.email
                        ] = user.displayName.toLowerCase()
                      } else {
                        attendeesName[user.email] = user.email
                          .split('@')[0]
                          .replace('.', ' ')
                          .toLowerCase()
                      }
                    }
                  })
                  break
                }
              }
              let attendingEmail = []
              let attendance2attending = {}
              attendees.forEach((expectedUser) => {
                for (let index = 0; index < attendingUsers.length; index++) {
                  const attendingUser = attendingUsers[index].toLowerCase()
                  if (
                    // ex. taro yamada === format(taro.yamada@gmail.com)
                    // ex. Taro Yamada === format(taro.yamada@gmail.com)
                    attendingUser === attendeesName[expectedUser]
                  ) {
                    attendingEmail.push(expectedUser)
                    attendance2attending[expectedUser] = attendingUser
                    // 同じ名前のattendingUserは複数カウントしない
                    break
                  } else {
                    attendance2attending[expectedUser] = ''
                  }
                }
              })
              // popupに結果を表示
              elem = document.getElementById('display-attendance')
              let text = `
                <table>
                  <tr>
                    <th>attending</th>
                    <td>${attendingEmail.length}</td>
                  </tr>
                  <tr>
                    <th>attendance</th>
                    <td>${attendees.length}</td>
                  </tr>
                </table>
              `
              // 不参加ユーザを上部に集める
              let not_attending = attending = ''
              for (let index = 0; index < attendees.length; index++) {
                const user = attendees[index]
                let color = 'skyblue'
                if (attendance2attending[user] === '') {
                  // 欠席ユーザ
                  color = 'tomato'
                  not_attending += `<div class="name-area" style="background-color:${color};">${user}</div>`
                } else {
                  attending += `<div class="name-area" style="background-color:${color};">${user}</div>`
                }
              }
              text += not_attending + attending

              // マッチしなかった参加ユーザ
              const matchAttendingUser = new Set(
                Object.values(attendance2attending)
              )
              let hasUnknownUser = true
              for (let index = 0; index < attendingUsers.length; index++) {
                if (
                  matchAttendingUser.has(attendingUsers[index].toLowerCase())
                ) {
                } else {
                  if (hasUnknownUser) {
                    text += `<div style="text-align:center; font-size:12px;">-- unknown --</div>`
                    hasUnknownUser = !hasUnknownUser
                  }
                  text += `<div class="name-area" style="background-color:gainsboro;">${attendingUsers[index]}</div>`
                }
              }
              text += `<div class="review-link"><a href="https://chrome.google.com/webstore/detail/google-meet-attendance-ma/gcjjaejjfoiaojgcenhjnbmmnphkojhd?hl=ja&authuser=1" target="_blank" rel="noopener noreferrer">Please Your Review!!</a></div>`
              elem.innerHTML = text
            })
        })
      })
    })
  })
}

// タブの情報を取得する
// https://www.itoukun.com/2019/11/09/chrome-extension-%E3%81%AE-unchecked-lasterror-value-error-could-not-establish-connection-receiving-end-does-not-exist-%E3%81%AE%E5%AF%BE%E5%87%A6%E6%B3%95/
function waitPageLoad(callback) {
  // 取得するタブの条件
  const queryInfo = {
    active: true,
    windowId: chrome.windows.WINDOW_ID_CURRENT
  }

  chrome.tabs.query(queryInfo, function (result) {
    // 配列の先頭に現在タブの情報が入っている
    const currentTab = result.shift()

    if (currentTab.status === 'complete') {
      // ロードが完了していたら、コールバックを実行
      callback(currentTab)
    } else {
      setTimeout(() => {
        // まだロード中だった場合は、ちょっとwaitして再帰的にこの処理を繰り返す
        waitPageLoad(callback)
      }, 100)
    }
  })
}
