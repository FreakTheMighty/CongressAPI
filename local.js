var express = require('express');
var app = express();
var aggregate = require('./aggregate');

app.get('/', function (req, res) {
  aggregate(function(err, data){
    if (!err) {
      console.log(data);
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    } else {
      res.status(500).send(err);
    }
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


