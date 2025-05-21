const express = require("express")
const router = express.Router()
const uploadController = require("../controllers/upload.controller")
const { verifyToken, checkPermission } = require("../middleware/auth")
const upload = require("../middleware/upload")


router.post("/images", verifyToken, checkPermission("upload_image"), upload.single("image"), uploadController.uploadImage)

module.exports = router
