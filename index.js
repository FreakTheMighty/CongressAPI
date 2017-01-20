var express = require('express');
var app = express();
var request = require('request');
var parser = require('xml2json');

var CONGRESS_XML = 'http://www.senate.gov/general/contact_information/senators_cfm.xml';

app.get('/', function (req, res) {

  request(CONGRESS_XML, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var json = parser.toJson(body);
      res.setHeader('Content-Type', 'application/json');
      res.send(json);
    }
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

