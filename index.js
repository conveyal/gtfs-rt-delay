const fs = require('fs')
const moment = require('moment')
const realtime = require('gtfs-realtime-bindings')
const fetch = require('isomorphic-fetch')

// a two-stop sequence to be delayed
const stop1 = 'TriMet:11503'
const stop2 = 'TriMet:11504'

// the date on which to delay all trips serving the above stops
const date = '20170926'

// the new arrival time for stop 1 (TODO: calc this automatically?)
const delayTo = 1506798836
const url = `http://localhost:8001/otp/routers/default/index/stops/${stop1}/stoptimes/${date}`

// set up an empty GTFS-RT message
const msg = new realtime.FeedMessage({
  header: new realtime.FeedHeader({
    gtfs_realtime_version: '1.0',
    timestamp: moment().unix()
  })
})

// counter for the update ids
let i = 1

// function to add a delayed-trip update to the message
function addDelayedTrip (tripId) {
  const tripUpdate = new realtime.TripUpdate({
    trip: new realtime.TripDescriptor({
      trip_id: tripId,
      start_date: date
    })
  })

  // add the first stop
  tripUpdate.stop_time_update.push(new realtime.TripUpdate.StopTimeUpdate({
    stop_id: stop1.split(':')[1],
    departure: new realtime.TripUpdate.StopTimeEvent({
      time: delayTo
    })
  }))

  // add the second stop (OTP demands there be at least 2 affected)
  tripUpdate.stop_time_update.push(new realtime.TripUpdate.StopTimeUpdate({
    stop_id: stop2.split(':')[1],
    departure: new realtime.TripUpdate.StopTimeEvent({
      time: delayTo + 1000
    })
  }))

  msg.entity.push(new realtime.FeedEntity({
    id: 'Trip update ' + (i++),
    trip_update: tripUpdate
  }))
}

// function to write the buffer
function writeBuffer () {
  console.log('writing gtfs protobuf')
  fs.writeFile('delay.proto', msg.encode().toBuffer(), () => {
    console.log('wrote file')
  })
}

// read and process the stop times
console.log('reading stoptimes from: ' + url)
fetch(url)
  .then(function (response) {
    if (response.status >= 400) {
      throw new Error('Bad response from server')
    }
    return response.json()
  })
  .then(function (results) {
    results.forEach(res => {
      res.times.forEach(time => {
        addDelayedTrip(time.tripId.split(':')[1])
      })
    })

    writeBuffer()
  })
