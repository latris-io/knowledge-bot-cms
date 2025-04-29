const path = require('path');

module.exports = ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: path.join('/Users/martybremer/Downloads/tmp', 'knowledge-bot-data.db'),
    },
    useNullAsDefault: true,
  },
});
