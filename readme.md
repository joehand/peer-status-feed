# Peer Status Feed

Like a letter but it doesn't need to go to the post office, stamps are free, and all your friends receive it just by having your address.

Share your status with friends! Whenever something consequential happens, the user can share their deepest feelings to any friends they've shared their key with. All data is sent directly between friends.

The user can update their own feed with status updates (i.e. arbitrary data). The user can also subscribe to friends' feeds. Social!

Need a friend to test peer-status-feed with? [Peer robot](https://github.com/joehand/peer-robot) is a friend that can beep and boop status updates to you!

## Installation 

```
npm install peer-status-feed
```

## Usage

Create a `PeerStatus` feed for the user. Add friends! Add status updates! Have a party on peer to peer networks.

Feeds are download only, so friends will only get your latest status if you are online or if they have it saved (not via other friends). 

On connection, it automatically connects to old friends (like the good old days) and their most recent status update is downloaded. As friend updates happen, they will be downloaded if connection stays open. Previously downloaded updates are cached and available without connection.

See `example.js` for example.

Check out [are-you-around](https://github.com/joehand/are-you-around) and [peer-robot](https://github.com/joehand/peer-robot) to see how to use it to make apps and robots.

## API

### var user = PeerStatus(opts)

options are:

* `db`: level compatible database
* `home`: base dir to put database (if not specified in `opts.db`)

### user.open(cb)

opens database and hypercore feeds. 

If an existing user is in database, it will also connect to existing friend feeds.

### user.appendStatus(data, [cb])

Append a status update to the feed. Data can be any object to be json serialized.

### user.addPeer(key, cb)

Add a friend (peer)! Will connect to the friend's status feed and download the latest status update.

### user.on('peer-data', data) 

Emitted when user receives data from peer (`data = {key: peerKey, data: {}`)

### user.key

Key to share to with friends to subscribe to status. Populated after open.

### user.status

Most recent user status. Populated after open for existing user.

## License

MIT