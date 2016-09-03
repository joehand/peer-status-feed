var events = require('events')
var path = require('path')
var util = require('util')
var hypercore = require('hypercore')
var createSwarm = require('hyperdrive-archive-swarm')
var level = require('level-party')
var homeDir = require('os-homedir')
var thunky = require('thunky')

module.exports = PeerStatus

function PeerStatus (opts) {
  if (!(this instanceof PeerStatus)) return new PeerStatus(opts)
  opts = opts || {}
  events.EventEmitter.call(this)

  var self = this
  self.options = opts
  self.status = null
  self.open = thunky(open)

  var dbDir = path.join(opts.home || homeDir(), '.peer-status.db')
  self.db = opts.db || level(dbDir, {valueEncoding: 'json'})
  self.core = hypercore(self.db)

  function open (cb) {
    self._open(cb)
  }

  self._emitError = function (err) {
    if (err) self.emit('error', err)
  }
}

util.inherits(PeerStatus, events.EventEmitter)

PeerStatus.prototype._open = function (cb) {
  var self = this
  self.db.get('!peerstatus!!user', function (_, keys) {
    var newUser = !(keys)
    keys = keys || {}
    self._feed = self.core.createFeed(keys.user, {live: true})
    self._peerKeyFeed = self.core.createFeed(keys.peers, {live: true})
    self.key = self._feed.key.toString('hex')
    if (newUser) {
      keys = {
        user: self.key,
        peers: self._peerKeyFeed.key.toString('hex')
      }
      return self.db.put('!peerstatus!!user', keys, done)
    }
    if (!self._feed.blocks) return done()
    self._feed.get(0, function (err, data) {
      if (err) return cb(err)
      self.status = JSON.parse(data.toString())
      done()
    })

    function done () {
      self._peerKeyFeed.open(function () {
        self._connectPeers()
        self._swarm = createSwarm(self._feed)
        cb()
      })
    }
  })
}

PeerStatus.prototype.appendStatus = function (data, cb) {
  var self = this
  cb = cb || self._emitError
  self._feed.append(JSON.stringify(data), function (err) {
    if (err) return cb(err)
    self.status = data
    cb()
  })
}

PeerStatus.prototype.addPeer = function (key, cb) {
  this._peerKeyFeed.append(key, cb)
}

PeerStatus.prototype.removePeer = function (key, cb) {
  this._peerSwarms[key].close()
  // TODO delete(?!) in hypercore feed
  cb()
}

PeerStatus.prototype._connectPeers = function () {
  var self = this
  var keyStream = self._peerKeyFeed.createReadStream({live: true})
  self._peerSwarms = []

  keyStream.on('data', function (data) {
    var key = data.toString()
    var feed = self.core.createFeed(key, {sparse: true})
    var swarm = createSwarm(feed, {upload: false})
    self._peerSwarms[key] = swarm
    feed.open(function () {
      if (feed.blocks) return connectFeed()
      feed.prioritize({start: 0})
      feed.once('update', function () {
        // wait for first block to get appended
        feed.unprioritize({start: 0})
        connectFeed()
      })
    })

    function connectFeed () {
      var dataStream = feed.createReadStream({live: true, start: feed.blocks - 1})
      dataStream.on('data', function (data) {
        // todo: turn into stream
        self.emit('peer-data', {
          key: key,
          data: JSON.parse(data.toString())
        })
      })
    }
  })
}
