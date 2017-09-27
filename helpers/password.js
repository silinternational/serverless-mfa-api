const bcrypt = require('bcrypt');

/**
 * WARNING: This requires strings, and if the value of hashedPassword is not an
 *          actual hash, this will return almost instantly, which may expose
 *          the existence of things through timing attacks.
 */
module.exports.compare = (givenPassword, hashedPassword) => {
  return bcrypt.compareSync(givenPassword, hashedPassword);
};

module.exports.hash = (password) => {
  return bcrypt.hashSync(password, 10);
};
