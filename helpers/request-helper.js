module.exports.getTotpHeaders = (headers = {}, callback) => {
  let totpHeaders = {};
  for (name in headers) {
    let lowercaseName = name.toLowerCase();
    if (lowercaseName.substr(0, 7) === 'x-totp-') {
      totpHeaders[lowercaseName.substr(7)] = headers[name];
    }
  }
  callback(null, totpHeaders);
};

module.exports.getJsonData = (jsonString = '{}', callback) => {
  const data = JSON.parse(jsonString);
  callback(null, data);
};
