'use strict';

const start = require('./tetris');

start(function (err, robot) {
  if (err) { 
    console.error(err);
    process.exit(1);
  }
  
  robot.on('report', function (report) {
    console.info(report);
  });
});
