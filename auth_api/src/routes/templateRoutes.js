// const express = require('express');
// const router = express.Router();
// const cloudinary = require('../config/cloudinaryConfig');

// router.get('/templates', async (req, res) => {
//     try {
//       // First try with 'raw'
//       let result = await cloudinary.api.resources({
//         type: 'upload',
//         resource_type: 'raw',
//         max_results: 100
//       });
  
//       let templates = result.resources;
  
//       // If no templates found in raw, try with image
//       if (templates.length === 0) {
//         const imageResult = await cloudinary.api.resources({
//           type: 'upload',
//           resource_type: 'image',
//           max_results: 100
//         });
//         templates = imageResult.resources;
//       }
//       const templateNames = {
//         "5_ca7x7s": "Professional Modern",
//         "6_lkokua": "Clean & Minimal",
//         "4_k92eoq": "Creative Blue",
//         "3_xrx4dm": "Classic Resume",
//         "2_fygxjc": "Elegant Design",
//         "1_raddui": "Simple Layout",
//       };
  
//       const formattedTemplates = templates
//         .filter(item => item.format === 'pdf')
//         .map(item => ({
//           url: item.secure_url,
//           public_id: item.public_id,
//           format: item.format,
//           templateName: templateNames[item.public_id] || "Untitled Template",
//         }));
  
//       if (formattedTemplates.length === 0) {
//         return res.json({ message: "No templates found in Cloudinary." });
//       }
  
//       res.json({ templates: formattedTemplates });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Failed to fetch templates' });
//     }
//   });
// module.exports = router;


// const templateController = require('../controllers/template_controller');

// // Endpoint to save template data
// router.post('/save-template', templateController.saveTemplate);

// module.exports = router;
