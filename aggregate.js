var _ = require('lodash');
var request = require('request');
var moment = require('moment');
var parseString = require('xml2js').parseString;
var stateHash = require('./state_hash');

var SENATE_API = 'http://www.senate.gov/general/contact_information/senators_cfm.xml';
var HOUSE_API = 'http://clerk.house.gov/xml/lists/MemberData.xml';

function normalizeHouse(houseContacts) {
  return _(houseContacts.MemberData.members.member)
    .map('member-info')
    .map(function(member){
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
      return normalMember;
    }).value();
};

function normalizeSenate(senateContacts) {
  return _(senateContacts.contact_information.member)
    .map(function(member){
      member.congress = 'senate';
      member.state_fullname = stateHash[member.state];
      return member
    });
};

module.exports = function(cb) {

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

};