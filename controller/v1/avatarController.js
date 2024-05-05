const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const imagekit = require("../../libs/imagekit");
const path = require("path");
const bcrypt = require("bcrypt");

module.exports = {
  create: async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      if (!req.file) {
        return res.status(400).json({
          status: false,
          message: "File gambar tidak ditemukan",
        });
      }

      let strFile = req.file.buffer.toString("base64");

      let { url } = await imagekit.upload({
        fileName: Date.now() + path.extname(req.file.originalname),
        file: strFile,
        folder: "/challenge6",
      });

      const exist = await prisma.user.findUnique({
        where: { id },
        include: { images: true },
      });

      if (!exist) {
        return res.status(404).json({
          status: false,
          message: `User with id ${id} not found`,
        });
      }

      const newImage = await prisma.image.create({
        data: {
          title: req.body.title || null,
          description: req.body.description || null,
          avatar_url: url,
          user: { connect: { id } },
        },
      });

      res.status(200).json({
        status: true,
        message: "Avatar updated successfully",
        data: newImage,
      });
    } catch (error) {
      next(error);
    }
  },
  index: async (req, res, next) => {
    const userId = Number(req.params.id);
    try {
      const userExist = await prisma.user.findUnique({
        where: { id: userId },
        include: { images: true },
      });

      if (!userExist) {
        return res.status(404).json({
          status: false,
          message: `User with id ${userId} not found`,
        });
      }

      const avatars = userExist.images;

      res.status(200).json({
        status: true,
        message: "List of user avatars retrieved successfully",
        data: avatars,
      });
    } catch (error) {
      next(error);
    }
  },
  update: async (req, res, next) => {
    const id = Number(req.params.id);
    const { title, description } = req.body;

    try {
      const imageExist = await prisma.image.findUnique({
        where: { id: id },
      });

      if (!imageExist) {
        return res.status(404).json({
          status: false,
          message: `Image with id ${id} not found`,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          status: false,
          message: "File gambar tidak ditemukan",
        });
      }

      let strFile = req.file.buffer.toString("base64");
      let { url } = await imagekit.upload({
        fileName: Date.now() + path.extname(req.file.originalname),
        file: strFile,
        folder: "/challenge6",
      });

      const updatedImage = await prisma.image.update({
        where: { id: id },
        data: {
          title: title || null, // Jika title tidak diberikan, gunakan nilai default null
          description: description || null, // Jika description tidak diberikan, gunakan nilai default null
          avatar_url: url || null, // Gunakan URL gambar baru dari ImageKit, jika tidak diberikan, gunakan nilai default null
        },
      });

      res.status(200).json({
        status: true,
        message: "Avatar data updated successfully",
        data: updatedImage,
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      const imageExist = await prisma.image.findUnique({
        where: { id: id },
      });

      if (!imageExist) {
        return res.status(404).json({
          status: false,
          message: `Image with id ${id} not found`,
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
        where: { id: id },
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
