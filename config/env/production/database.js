module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST'),         // e.g., dpg-xxx.render.com
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME'),
      user: env('DATABASE_USERNAME'),
      password: env('DATABASE_PASSWORD'),
      ssl: {
        rejectUnauthorized: false,        // Important for Render's SSL
      },
    },
    pool: {                               // Optional: helps with performance
      min: 0,
      max: 10,
    },
  },
});