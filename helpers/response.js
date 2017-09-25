module.exports.returnError = (statusCode, error, callback) => {
  const response = {
    statusCode: statusCode,
    body: JSON.stringify({
      "message": error,
      "status": statusCode
    })
  };
  callback(null, response);
};

module.exports.returnSuccess = (item, callback) => {
  const response = {
    statusCode: item ? 200 : 204,
    body: JSON.stringify(item)
  };
  callback(null, response);
};
