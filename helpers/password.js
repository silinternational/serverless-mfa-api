const bcrypt = require('bcryptjs');

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

module.exports.pretendToCompare = () => {
  /* Perform a password hash so that the timing is similar to when we really do
   * compare a password to a hash, to protect against timing attacks.  */
  module.exports.hash('dummy text');
};
