// const Template = require('../models/template');

// // Save selected template to MongoDB
// exports.saveTemplate = async (req, res) => {
//   const { userId, templateId, templateName, templateUrl } = req.body;

//   try {
//     // Check if the user already has a saved template
//     const existingTemplate = await Template.findOne({ userId });

//     if (existingTemplate) {
//       // If a template exists, update it
//       existingTemplate.templateId = templateId;
//       existingTemplate.templateName = templateName;
//       existingTemplate.templateUrl = templateUrl;
//       await existingTemplate.save();

//       return res.status(200).json({
//         message: 'Template updated successfully',
//         data: existingTemplate,
//       });
//     }

//     // If no template is saved, create a new entry
//     const newTemplate = new Template({
//       userId,
//       templateId,
//       templateName,
//       templateUrl,
//     });

//     await newTemplate.save();

//     res.status(201).json({
//       message: 'Template saved successfully',
//       data: newTemplate,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: 'Error occurred while saving template',
//       error: error.message,
//     });
//   }
// };
