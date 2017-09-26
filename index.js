const fs = require('fs')
const moment = require('moment')
const realtime = require('gtfs-realtime-bindings')
const fetch = require('isomorphic-fetch')

const stopId = 'TriMet:11503'
const date = '20170831'
const url = `http://localhost:8001/otp/routers/default/index/stops/${stopId}/stoptimes/${date}`

// set up an empty GTFS-RT message
const msg = new realtime.FeedMessage({
  header: new realtime.FeedHeader({
    gtfs_realtime_version: '1.0',
    timestamp: moment().unix()
  })
})

// counter for the update ids
let i = 1

// function to add a skip-stop update to the message
function addSkippedStop (tripId) {
  const tripUpdate = new realtime.TripUpdate({
    trip: new realtime.TripDescriptor({
      trip_id: tripId,
      start_date: date
    })
  })

  tripUpdate.stop_time_update.push(new realtime.TripUpdate.StopTimeUpdate({
    stop_id: stopId.split(':')[1],
    //schedule_relationship: realtime.TripUpdate.StopTimeUpdate.ScheduleRelationship.
    departure: new realtime.TripUpdate.StopTimeEvent({
      time: 1504172448
    })
  }))

  tripUpdate.stop_time_update.push(new realtime.TripUpdate.StopTimeUpdate({
    stop_id: '11504',
    //schedule_relationship: realtime.TripUpdate.StopTimeUpdate.ScheduleRelationship.SKIPPED
    departure: new realtime.TripUpdate.StopTimeEvent({
      time: 1504173448
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
  fs.writeFile('skip.proto', msg.encode().toBuffer(), () => {
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
    //console.log(results)
    results.forEach(res => {
      res.times.forEach(time => {
        //console.log(time);
        addSkippedStop(time.tripId.split(':')[1])
      })
    })

    writeBuffer()
  })
