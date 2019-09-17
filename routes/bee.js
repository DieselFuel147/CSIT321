const express = require('express');
const router = express.Router();

let database
module.exports = function(db) {
  database = db;
  return router;
};

function userHasDevice(username, uuid) {
  return new Promise(function (resolve, reject) {
    database.getDevicesByUser(username, (err, devices) => {
      if (devices.some(function(device) {
        device.uuid === uuid;
      })) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

function getUserDeviceStats(username, enddate, days) {
  return new Promise(function (resolve, reject) {
    database.getDeviceStatisticsByUser(username, enddate, days, (err, stats) => {
      if (err) {
        reject(new Error("Error retrieving device stats", err));
        console.log(err);
        return;
      }
      resolve(stats);
      console.log(stats);
    });
  });
}

// Gets the average of all logs for a specific day
router.get('/avg/day/:day', function(req, res, next) {
  if (!req.session.username) {
    res.sendStatus(403).end();
    return;
  }

  var day = req.params.day;

  database.getAverageForDay(day, req.session.username, function getAverage(err, data) {
    if (err || data.length == 0) {
      res.status(404).end('No records exist for day.');
    } else {
      res.json(data[0]);
    }
  });

});

// Gets the average detection for an entire week, ending on the specified day
router.get('/avg/week/:day', function(req, res, next) {
  if (!req.session.username) {
    res.sendStatus(403).end();
    return;
  }

  var day = req.params.day;

  database.getAverageForWeek(week, req.session.username, function getAverage(err, week) {
    if (err) {
      res.statud(404).end('No records exist for week.');
    } else {
      res.json(week);
    }
  });
});

router.get('/status/total', function(req, res, next) {
  // Get the current total of all devices
  if (!req.session.username) {
    res.status(403).end('Not logged in');
    return;
  }

  database.getDeviceStatusesByUser(req.session.username, function(err, devices) {
    if (err || devices.length == 0) {
      res.status(404).end('No Devices');
      return;
    }

    var totalPeopleCount = devices.reduce(function(valueA, valueB) {
      return valueA.people + valueB.people;
    });

    res.json({
      count: totalPeopleCount
    }).end();
  });
});

// Returns status for all devices for the specified user
router.get('/status', function (req, res, next) {
  if (!req.session.username) {
    res.status(403).end();
    return;
  }
  
  // Return a JSON document for the registered user with all specified devices for this user
  database.getDeviceStatusesByUser(req.session.username, (err, rows) => {
    devices = rows;
    if (err) {
      res.status(404).end('Error fetching results.');
    } else {
      res.json({
        devices: devices
      });
    }
  
  });
});

// Returns statistics for all the user devies
router.get('/stats/:endDate/:days', async function(req, res, next) {
  if (!req.session.username) {
    res.sendStatus(403).end();
    return;
  }

  try {
    var deviceStats = await getUserDeviceStats(req.session.username, req.params.endDate, req.params.days);
    console.log(deviceStats);

    res.json(deviceStats);

  } catch(e) {
    res.sendStatus(403);
    console.log(e);
  }

});

// Returns statistics for a single device
router.post('/stats/:deviceId', async function(req, res, next) {
  var deviceId = req.params.deviceId;

  if (!req.session.username) {
    res.sendStatus(403).end();
    return;
  }

  var hasDevice = await userHasDevice(req.session.username, deviceId);

  if (!req.body) {
    res.status(400).end('Provide a valid date body');
    return;
  }

  if (!hasDevice) {
    res.status(403).end('User not registered to device.');
    return;
  }

  database.getDevicesStatisticsByUUID(req.uuid, req.body.enddate, req.body.days, (err, stats) => {
    if (err) {
      res.status(404).end('Device UUID not found.');
    } else {
      // Return a set of statistics for the device in a JSON document
      res.json(stats);
    }
  });

});

/* POST update. */
router.post('/update', function(req, res, next) {
  if (!req.body.uuid) {
    res.sendStatus(403);
    return;
  }

  /* Create session from sent uuid */ 
  database.getDeviceByUUID(req.body.uuid, (err, device) => {
    if (err || !device) {
      res.status(404).end('device uuid not found or not registered to an account.');
    } else {
      database.updateDeviceStatus(req.body.uuid, req.body);
      res.status(200).end('status updated');
    }
  });

});