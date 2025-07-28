const path = require('path');

module.exports = ({ env }) => {
  // Handle test environment with separate database
  if (env('NODE_ENV') === 'test') {
    return {
      connection: {
        client: 'better-sqlite3',
        connection: {
          filename: path.join(__dirname, '..', 'tests', 'temp', 'test.db'),
        },
        pool: {
          min: 1,
          max: 1,
        },
        useNullAsDefault: true,
        debug: false,
      },
    };
  }

  // Check if we're in production or if DATABASE_URL is set
  const isProduction = env('NODE_ENV') === 'production';
  const databaseUrl = env('DATABASE_URL');
  
  // Force PostgreSQL in production or when DATABASE_URL is provided
  if (isProduction || databaseUrl) {
    console.log('🔧 [DATABASE] Using PostgreSQL configuration for production');
    
    const config = {
      connection: {
        client: 'postgres',
        connection: {},
        pool: {
          min: env.int('DATABASE_POOL_MIN', 0),
          max: env.int('DATABASE_POOL_MAX', 10),
        },
      },
    };

    // If DATABASE_URL is provided, use it
    if (databaseUrl) {
      config.connection.connection = {
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false, // Required for Render and many cloud providers
        },
      };
    } else {
      // Otherwise use individual connection parameters
      config.connection.connection = {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: {
          rejectUnauthorized: false,
        },
      };
    }

    return config;
  }

  // Development/local configuration
  console.log('🔧 [DATABASE] Using SQLite configuration for development');
  const client = env('DATABASE_CLIENT', 'better-sqlite3');

  const connections = {
    postgres: {
      connection: {
        connectionString: env('DATABASE_URL'),
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          key: env('DATABASE_SSL_KEY', undefined),
          cert: env('DATABASE_SSL_CERT', undefined),
          ca: env('DATABASE_SSL_CA', undefined),
          capath: env('DATABASE_SSL_CAPATH', undefined),
          cipher: env('DATABASE_SSL_CIPHER', undefined),
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
      },
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
    },
    'better-sqlite3': {
      connection: {
        filename: path.join(__dirname, '..', 'database', env('DATABASE_FILENAME', 'strapi.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
}; 
 
 
 
 
 