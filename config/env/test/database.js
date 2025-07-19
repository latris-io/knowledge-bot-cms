const path = require('path');

module.exports = ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: path.join(__dirname, '..', '..', '..', 'tests', 'temp', 'test.db'),
    },
    useNullAsDefault: true,
  },
}); 