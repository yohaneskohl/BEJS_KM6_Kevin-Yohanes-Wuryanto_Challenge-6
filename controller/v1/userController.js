const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const imagekit = require("../../libs/imagekit");
const path = require("path");
const bcrypt = require("bcrypt");

module.exports = {
  store: async (req, res, next) => {
    try {
      let { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          status: false,
          message: "Input Required",
        });
      }

      let exist = await prisma.user.findFirst({
        where: { email },
      });

      if (exist) {
        return res.status(401).json({
          status: false,
          message: "Email already used",
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);
      let user = await prisma.user.create({
        data: {
          name,
          email,
          password: encryptedPassword,
        },
      });

      res.status(201).json({
        status: true,
        message: "User berhasil didaftarkan",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  index: async (req, res, next) => {
    try {
      let { search } = req.query;

      let users = await prisma.user.findMany({
        where: { name: { contains: search } },
        orderBy: { id: "asc" },
        include: { images: true },
      });

      users.forEach((user) => {
        delete user.password;
      });

      if (users.length === 0) {
        res.status(404).json({
          status: false,
          message: `Users dengan nama ${search} tidak ada!`,
        });
      }

      res.status(200).json({
        status: true,
        message: "Berhasil mengambil data Users",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      let { name, email, password } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          status: false,
          message: "All Input Update Required",
        });
      }

      const exist = await prisma.user.findUnique({
        where: { id },
      });

      if (!exist) {
        return res.status(404).json({
          status: false,
          message: `User with id ${id} not found`,
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name,
          email,
          password: encryptedPassword,
        },
      });

      res.status(200).json({
        status: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const exist = await prisma.user.findUnique({
        where: { id },
        include: { images: true },
      });

      if (!exist) {
        return res.status(404).json({
          status: false,
          message: `User with id ${id} not found`,
          data: null,
        });
      }

      if (exist.avatar_id) {
        imagekit.deleteFile(exist.avatar_id, async (error, result) => {
          if (error) {
            console.error(
              "Failed to delete avatar from ImageKit:",
              error.message
            );
            return res.status(500).json({
              status: false,
              message: "Failed to delete avatar from ImageKit",
            });
          }
          console.log("Avatar deleted successfully from ImageKit");
        });
      }

      if (exist.image) {
        for (const image of exist.image) {
          try {
            if (image.image_id) {
              await imageKit.deleteFile(image.image_id);
            } else {
              console.log("Image ID is missing for image:", image.id);
            }
          } catch (error) {
            console.error(
              "Failed to delete image from ImageKit:",
              error.message
            );
          }
        }
      }

      await prisma.image.deleteMany({
        where: { user_id: id },
      });

      await prisma.user.delete({
        where: { id },
      });

      res.status(200).json({
        status: true,
        message: "User and associated images deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    const imageId = Number(req.params.imageId);

    try {
      const imageExist = await prisma.image.findUnique({
        where: { id: imageId },
      });

      if (!imageExist) {
        return res.status(404).json({
          status: false,
          message: `Image with id ${imageId} not found`,
        });
      }

      if (imageExist.avatar_url) {
        const fileName = imageExist.avatar_url.split("/").pop();

        await imagekit.deleteFile(fileName, async (error, result) => {
          if (error) {
            console.error(
              "Failed to delete avatar from ImageKit:",
              error.message
            );
            return res.status(500).json({
              status: false,
              message: "Failed to delete avatar from ImageKit",
            });
          }
          console.log("Avatar deleted successfully from ImageKit");
        });
      }
      await prisma.image.delete({
        where: { id: imageId },
      });

      res.status(200).json({
        status: true,
        message: "Avatar deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
