const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;
const { image } = require("../../libs/multer.js");

const swaggerUI = require("swagger-ui-express");
const yaml = require("yaml");
const fs = require("fs");
const path = require("path");

const swagger_path = path.resolve(__dirname, "../../api-docs.yaml");
const file = fs.readFileSync(swagger_path, "utf-8");

const swaggerDocument = yaml.parse(file);
router.use(
  "/api/v1/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerDocument)
);

// Restrict for Authenticate (jika gamau repot login, gausah, hapus aja)
let restrict = (req, res, next) => {
  let { authorization } = req.headers;
  if (!authorization || !authorization.split(" ")[1]) {
    res.status(400).json({
      status: false,
      message: "Token not provided",
      data: null,
    });
  }

  let token = authorization.split(" ")[1];
  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
      res.status(401).json({
        status: false,
        message: err.message,
        data: null,
      });
    }
    delete user.iat;
    req.user = user;
  });
  next();
};

const userController = require("../../controller/v1/userController.js");
const authController = require("../../controller/v1/authController.js");
const avatarController = require("../../controller/v1/avatarController.js");

router.post("/api/v1/users", userController.store);
router.get("/api/v1/users", restrict, userController.index);
router.put("/api/v1/users/:id", restrict, userController.update);


router.post("/api/v1/avatar/:id", restrict, image.single("file"), avatarController.create);
router.get("/api/v1/avatar/:id", restrict, avatarController.index);
router.put("/api/v1/avatar/:id", restrict, image.single("file"), avatarController.update);
router.delete("/api/v1/avatar/:id", restrict, avatarController.delete);

router.delete("/api/v1/delete/:id", restrict, userController.delete);

router.post("/api/v1/auth/login", authController.login);
router.get("/api/v1/auth/authenticate", restrict, authController.auth);



module.exports = router;
