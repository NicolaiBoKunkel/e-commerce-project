const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
  }
);

const connectWithRetry = async () => {
  let retries = 5;
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log("Database connected!");
      break;
    } catch (err) {
      console.error("DB connection failed. Retrying...", err);
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

module.exports = { sequelize, connectWithRetry };

