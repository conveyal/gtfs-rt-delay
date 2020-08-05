# gtfs-rt-delay

This tool contains scripts for generating simple mock GTFS-rt feeds to simulate:
 - arrival delays
 - alerts


Note: OTP config for GTFS-rt looks like the below.

```json
{
    "type": "real-time-alerts",
    "frequencySec": 20,
    "earlyStart": 864000,
    "url": "https://datatools-511ny.s3.amazonaws.com/gtfs-rt-alerts/alerts-4464.pb",
    "feedId": "8"
},
```
