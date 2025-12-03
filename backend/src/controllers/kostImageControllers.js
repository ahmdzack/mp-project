const { Kost, KostImage } = require('../models');
const { cloudinary } = require('../config/cloudinary');

// Upload images to kost
const uploadKostImages = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;

    // Validate files
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    // Check if kost exists
    const kost = await Kost.findByPk(id);
    
    if (!kost) {
      // Delete uploaded files from Cloudinary if kost not found
      for (const file of files) {
        const publicId = file.filename;
        await cloudinary.uploader.destroy(publicId);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Kost not found'
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && kost.owner_id !== req.user.id) {
      // Delete uploaded files if unauthorized
      for (const file of files) {
        const publicId = file.filename;
        await cloudinary.uploader.destroy(publicId);
      }
      
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload images to this kost'
      });
    }

    // Check if kost already has primary image
    const existingImages = await KostImage.findAll({
      where: { kost_id: id }
    });

    const hasPrimary = existingImages.some(img => img.is_primary);

    // Create image records
    const imageRecords = files.map((file, index) => ({
      kost_id: id,
      image_url: file.path,
      is_primary: !hasPrimary && index === 0 // First image is primary if no primary exists
    }));

    const images = await KostImage.bulkCreate(imageRecords);

    res.status(201).json({
      success: true,
      message: `${images.length} image(s) uploaded successfully`,
      data: images
    });

  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get kost images
const getKostImages = async (req, res) => {
  try {
    const { id } = req.params;

    const kost = await Kost.findByPk(id);
    
    if (!kost) {
      return res.status(404).json({
        success: false,
        message: 'Kost not found'
      });
    }

    const images = await KostImage.findAll({
      where: { kost_id: id },
      order: [
        ['is_primary', 'DESC'],
        ['created_at', 'ASC']
      ]
    });

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });

  } catch (error) {
    console.error('Get kost images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch images'
    });
  }
};

// Set primary image
const setPrimaryImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    // Check if kost exists
    const kost = await Kost.findByPk(id);
    
    if (!kost) {
      return res.status(404).json({
        success: false,
        message: 'Kost not found'
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && kost.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if image exists
    const image = await KostImage.findOne({
      where: { id: imageId, kost_id: id }
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Set all images to not primary
    await KostImage.update(
      { is_primary: false },
      { where: { kost_id: id } }
    );

    // Set this image as primary
    await image.update({ is_primary: true });

    res.status(200).json({
      success: true,
      message: 'Primary image updated',
      data: image
    });

  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update primary image'
    });
  }
};

// Delete single image
const deleteKostImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    // Check if kost exists
    const kost = await Kost.findByPk(id);
    
    if (!kost) {
      return res.status(404).json({
        success: false,
        message: 'Kost not found'
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && kost.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Find image
    const image = await KostImage.findOne({
      where: { id: imageId, kost_id: id }
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Extract public_id from Cloudinary URL
    const urlParts = image.image_url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = `kost-images/${filename.split('.')[0]}`;

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError);
      // Continue anyway to delete from database
    }

    // Delete from database
    await image.destroy();

    // If deleted image was primary, set another as primary
    if (image.is_primary) {
      const firstImage = await KostImage.findOne({
        where: { kost_id: id },
        order: [['created_at', 'ASC']]
      });
      
      if (firstImage) {
        await firstImage.update({ is_primary: true });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
};

// Delete all kost images (admin only)
const deleteAllKostImages = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if kost exists
    const kost = await Kost.findByPk(id);
    
    if (!kost) {
      return res.status(404).json({
        success: false,
        message: 'Kost not found'
      });
    }

    // Authorization check (admin only)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete all images'
      });
    }

    // Get all images
    const images = await KostImage.findAll({
      where: { kost_id: id }
    });

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No images found for this kost'
      });
    }

    // Delete from Cloudinary
    for (const image of images) {
      const urlParts = image.image_url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = `kost-images/${filename.split('.')[0]}`;
      
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error(`Failed to delete ${publicId} from Cloudinary:`, cloudinaryError);
      }
    }

    // Delete from database
    const deletedCount = await KostImage.destroy({
      where: { kost_id: id }
    });

    res.status(200).json({
      success: true,
      message: `${deletedCount} image(s) deleted successfully`
    });

  } catch (error) {
    console.error('Delete all images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete images'
    });
  }
};

module.exports = {
  uploadKostImages,
  getKostImages,
  setPrimaryImage,
  deleteKostImage,
  deleteAllKostImages
};