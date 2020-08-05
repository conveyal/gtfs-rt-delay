// @flow
const alertData = require('./data/alert-data')

const fs = require('fs')
const moment = require('moment')
const realtime = require('gtfs-realtime-bindings')
const fetch = require('isomorphic-fetch')

function createEmptyFeed () {
  return new realtime.FeedMessage({
    header: new realtime.FeedHeader({
      gtfs_realtime_version: '1.0',
      timestamp: moment().unix()
    })
  })
}

// function to write the buffer
function writeBuffer (msg, filename) {
  console.log('writing gtfs protobuf')
  const alertsFeedAsJson = JSON.stringify(msg, null, 2)
  console.log(alertsFeedAsJson)
  const dir = 'out'
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir)
  }
  const pbPath = `${dir}/${filename}.pb`
  const jsonPath = `${dir}/${filename}.json`
  fs.writeFile(pbPath, msg.encode().toBuffer(), () => {
    console.log(`wrote protocol buffer file to ${pbPath}`)
  })
  fs.writeFile(jsonPath, alertsFeedAsJson, () => {
    console.log(`wrote JSON file to ${jsonPath}`)
  })
}
let i = 0
// function to add an agency-wide alert to feed.
function addAgencyAlert (msg, agency_id, properties) {
  const informed_entity = new realtime.EntitySelector()
  informed_entity.agency_id = agency_id
  const alert = new realtime.Alert({
    informed_entity,
    ...properties
  })

  msg.entity.push(new realtime.FeedEntity({
    id: `Agency Alert ${i++}`,
    alert
  }))
}

// function to add an route-specific alert to feed.
function addRouteAlert (msg, route_id, properties) {
  const informed_entity = new realtime.EntitySelector()
  informed_entity.route_id = route_id
  const alert = new realtime.Alert({
    informed_entity,
    ...properties
  })

  msg.entity.push(new realtime.FeedEntity({
    id: `Agency Alert ${i++}`,
    alert
  }))
}

// For each item in the alerts data, generate the appropriate alert.
alertData.forEach((agency, i) => {
  const {agency_id, route_id, ...strings} = agency
  const covidProps = {
    cause: 'MEDICAL_EMERGENCY',
    effect: 'REDUCED_SERVICE'
  }
  const defaultProps = {
    cause: 'UNKNOWN_CAUSE',
    effect: 'REDUCED_SERVICE'
  }
  // Only supports agency or route alerts for now.
  if (!agency_id || !route_id) {
    console.warn('We only support the generation of route or agency alerts. Please provide route or agency id.')
    return
  }
  // Check the string props and make sure they are formatted correctly.
  const allowedProps = ['header_text', 'description_text', 'url']
  for (var key in strings) {
    if (strings.hasOwnProperty(key) && allowedProps.indexOf(key) !== -1) {
      const text = strings[key]
      const language = 'en'
      strings[key] = { translation: [ { text, language } ] }
    } else {
      delete strings[key]
    }
  }
  const props = {
    ...defaultProps,
    ...strings
  }
  const alertsFeed = createEmptyFeed()
  if (agency_id) addAgencyAlert(alertsFeed, agency_id, props)
  else if (route_id) addRouteAlert(alertsFeed, route_id, props)
  const alertId = agency_id || route_id
  writeBuffer(alertsFeed, `alerts-${alertId}`)
})
