module['exports'] = function convert(hook) {

  var moment = require('moment');
  var aggregate = require('./aggregate');

  var CACHE_KEY = 'contacts';

  client.get(CACHE_KEY, function (err, cachedContacts) {

    var duration;

    if (cachedContacts) {
      var cachedOn = moment(cachedContacts.cachedOn);
      duration = moment.duration(cachedOn.diff(moment()));
    }

    if (duration && duration.asHours() < 1) {
      hook.res.json(cachedContacts);
    } else {
      aggregate(function (err, data) {
        if (!err) {
          client.set(CACHE_KEY, data, function (err) {
            hook.res.json(data);
          });
        }
      });
    }
  });
};
