const { Pool } = require("pg");

const useSsl = process.env.DB_SSL === "true";
const hasConnectionString = Boolean(process.env.DATABASE_URL);

const pool = new Pool(
  hasConnectionString
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT || 5432),
        ssl: useSsl ? { rejectUnauthorized: false } : false,
      }
);

module.exports = {
  query: (text, params) => pool.query(text, params),
};
