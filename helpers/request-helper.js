module.exports.getMfaHeaders = (headers = {}) => {
  let totpHeaders = {};
  for (name in headers) {
    let lowercaseName = name.toLowerCase();
    if (lowercaseName.substr(0, 6) === 'x-mfa-') {
      totpHeaders[lowercaseName.substr(6)] = headers[name];
    }
  }
  return totpHeaders;
};

module.exports.getJsonData = (jsonString) => {
  jsonString = jsonString || '{}';
  return JSON.parse(jsonString.trim() || '{}');
};
