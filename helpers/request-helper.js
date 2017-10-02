module.exports.getTotpHeaders = (headers = {}) => {
  let totpHeaders = {};
  for (name in headers) {
    let lowercaseName = name.toLowerCase();
    if (lowercaseName.substr(0, 7) === 'x-totp-') {
      totpHeaders[lowercaseName.substr(7)] = headers[name];
    }
  }
  return totpHeaders;
};

module.exports.getJsonData = (jsonString) => {
  jsonString = jsonString || '{}';
  return JSON.parse(jsonString.trim() || '{}');
};
