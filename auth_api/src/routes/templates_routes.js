const express = require("express"); const router = express.Router(); const { getAllTemplates } = require("../controllers/template_controllers"); // ✅ Import the controller function

router.get("/templates", getAllTemplates);

module.exports = router;