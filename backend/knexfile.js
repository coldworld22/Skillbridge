module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'localhost',       // أو اسم الخدمة في Docker مثل: postgres
      user: 'postgres',
      password: 'your_db_password',
      database: 'eduskillbridge',
      port: 5432,
    },
    migrations: {
      directory: './src/migrations'
    },
    seeds: {
      directory: './src/seeds'
    }
  }
};
