module['exports'] = function convert(hook) {

  var stateHash = {
    AL: 'Alabama',
    AK: 'Alaska',
    AS: 'American Samoa',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    DC: 'District Of Columbia',
    FM: 'Federated States Of Micronesia',
    FL: 'Florida',
    GA: 'Georgia',
    GU: 'Guam',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MH: 'Marshall Islands',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    MP: 'Northern Mariana Islands',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PW: 'Palau',
    PA: 'Pennsylvania',
    PR: 'Puerto Rico',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VI: 'Virgin Islands',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming'
  };

  var CACHE_KEY = 'contacts/7';

  var SENATE_API = 'http://www.senate.gov/general/contact_information/senators_cfm.xml';

  var HOUSE_API = 'http://clerk.house.gov/xml/lists/MemberData.xml';

  var moment = require('moment');

  var _ = require('lodash');

  var request = require('request');

  var moment = require('moment');

  var parseString = require('xml2js').parseString;

  var store = hook.datastore;


  function normalizeHouse(houseContacts) {
    return _(houseContacts.MemberData.members.member)
      .map('member-info')
      .map(function (member) {
        normalMember = {};
        normalMember.congress = 'house';
        normalMember.member_full = [member.firstname, member.middlename, member.lastname].join(' ');
        normalMember.last_name = member.lastname;
        normalMember.first_name = member.firstname;
        normalMember.party = member.party;
        normalMember.state = member.state.$['postal-code'];
        normalMember.state_fullname = member.state['state-fullname'];
        normalMember.bioguide_id = member.bioguideID;
        normalMember.phone = member.phone;
        normalMember.photo = 'https://www.congress.gov/img/member/114_rp_ca_31_aguilar_pete_200.jpg';
        return normalMember;
      }).value();
  };

  function normalizeSenate(senateContacts) {
    return _(senateContacts.contact_information.member)
      .map(function (member) {
        member.congress = 'senate';
        member.state_fullname = stateHash[member.state];
        member.member_full = [member.first_name, member.last_name].join(' ');
        member.photo = `https://www.congress.gov/img/member/${member.bioguide_id.toLowerCase()}_200.jpg`;
        return member
      });
  };


  function fetch(cb) {
    request(SENATE_API, function (error, response, senateBody) {

      if (!error && response.statusCode == 200) {

        request(HOUSE_API, function (error, response, houseBody) {

          if (!error && response.statusCode == 200) {
            parseString(senateBody, {explicitArray: false}, function (err, senateContacts) {
              if (err) return cb(err);

              parseString(houseBody, {explicitArray: false}, function (err, houseContacts) {
                var contacts = {
                  contacts: normalizeHouse(houseContacts).concat(normalizeSenate(senateContacts)),
                  cachedOn: new Date()
                };
                cb(null, contacts);
              });
            });
          } else {
            return cb(error);
          }

        })

      } else {
        return cb(error);
      }
    });

  }

  store.get(CACHE_KEY, function (err, cachedContacts) {

    var duration;

    if (cachedContacts) {
      cachedContacts = JSON.parse(cachedContacts);
      var cachedOn = moment(cachedContacts.cachedOn);
      duration = moment.duration(cachedOn.diff(moment()));
    }

    if (duration && duration.asHours() < 1) {
      hook.res.json(cachedContacts);
    } else {
      fetch(function (err, data) {
        if (!err) {

          request.post({
            url: 'https://hook.io/datastore/set?hook_private_key=59d58a11-8180-4deb-bb1b-a8850ac1dc02',
            formData: {key: CACHE_KEY, value: JSON.stringify(data)}
          }, function (err, httpResponse, body) {
            if (!err) {
              hook.res.json(data);
            } else {
              hook.res.status(500).json(err);
            }
          });
        }
      });
    }
  });
};
