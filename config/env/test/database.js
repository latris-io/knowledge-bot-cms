const path = require('path');

module.exports = ({ env }) => ({
  connection: {
    client: 'better-sqlite3',
    connection: {
      filename: path.join(__dirname, '../../../tests/temp/test.db'),
    },
    useNullAsDefault: true,
    debug: false,
  },
}); 