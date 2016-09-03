var memdb = require('memdb')
var PeerStatus = require('.')

var user = PeerStatus()
var i = 0

user.open(function () {
  createFriend(function (err, key) {
    if (err) throw err
    user.addPeer(key)
  })
  user.on('peer-data', function (data) {
    console.log(data)
  })
  // setTimeout(function () {
  //   createFriend(function (err, key) {
  //     user.addFriend(key)
  //   })
  // }, 3000)
})

function createFriend (cb) {
  var friend = PeerStatus({db: memdb()})
  var name = 'robot-' + i
  i++

  console.log('making a friend', name)
  friend.open(function () {
    cb(null, friend.key)
    setInterval(function () {
      doStatus()
    }, 5000)
    doStatus()
  })

  function doStatus () {
    friend.appendStatus({name: name, status: 'online', message: 'beep boop ' + new Date()}, function (err) {
      if (err) throw cb(err)
    })
  }
}
