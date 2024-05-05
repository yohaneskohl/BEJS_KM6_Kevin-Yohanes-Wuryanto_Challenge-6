const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  login: async (req, res, next) => {
    try {
      let { name, email, password } = req.body;

      let user = await prisma.user.findFirst({ where: { email } });
      if (!name || !email || !password) {
        return res.status(400).json({
          status: false,
          message: "Invalid email",
          data: null,
        });
      }

      let token = jwt.sign(user, JWT_SECRET_KEY);

      return res.status(201).json({
        status: true,
        message: "OK",
        data: { ...user, token },
      });
    } catch (error) {
      next(error);
    }
  },

  auth: async (req, res, next) => {
    try {
      return res.status(200).json({
        status: true,
        message: "OK",
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  },
};
