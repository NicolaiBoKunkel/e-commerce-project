const { sequelize } = require("../sequelize");

const User = sequelize.define("User", {
  username: {
    type: require("sequelize").STRING,
    allowNull: false,
  },
  password: {
    type: require("sequelize").STRING,
    allowNull: false,
  },
});

module.exports = User;

