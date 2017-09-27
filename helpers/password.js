const bcrypt = require('bcrypt');

module.exports.compare = (givenPassword, hashedPassword) => {
  return bcrypt.compareSync(givenPassword, hashedPassword);
};

module.exports.hash = (password) => {
  return bcrypt.hashSync(password, 10);
};
