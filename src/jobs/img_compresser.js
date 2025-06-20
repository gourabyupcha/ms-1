const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

exports.compressionLogic = async (buffer, originalName, options = {}) => {
  const {
    targetFormat = null, // null means auto-detect optimal format
    quality = 75,
    maxWidth = 1920,
    maxHeight = 1080,
    enableProgressive = true,
    stripMetadata = false
  } = options;

  const extension = originalName.split('.').pop().toLowerCase();
  
  if (!['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'tiff', 'bmp'].includes(extension)) {
    throw new Error(`Unsupported image format: ${extension}`);
  }

  try {
    // Auto-detect optimal format if not specified
    const finalFormat = targetFormat || await getOptimalFormat(buffer);
    
    // Get image metadata first
    const metadata = await sharp(buffer).metadata();
    const { width, height, format } = metadata;
    
    // Calculate optimal dimensions while maintaining aspect ratio
    let newWidth = width;
    let newHeight = height;
    
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (aspectRatio > 1) {
        newWidth = Math.min(width, maxWidth);
        newHeight = Math.round(newWidth / aspectRatio);
      } else {
        newHeight = Math.min(height, maxHeight);
        newWidth = Math.round(newHeight * aspectRatio);
      }
    }

    let sharpInstance = sharp(buffer);
    
    // Preserve metadata unless explicitly stripped
    if (!stripMetadata) {
      sharpInstance = sharpInstance.withMetadata();
    }
    
    // Resize if needed
    if (newWidth !== width || newHeight !== height) {
      sharpInstance = sharpInstance.resize(newWidth, newHeight, {
        kernel: sharp.kernel.lanczos3, // High-quality resampling
        withoutEnlargement: true
      });
    }

    // Apply format-specific optimizations
    let outputBuffer;
    
    switch (finalFormat) {
      case 'webp':
        outputBuffer = await sharpInstance
          .webp({
            quality,
            effort: 6, // Max compression effort (0-6)
            smartSubsample: true, // Better color accuracy
            nearLossless: quality >= 90, // Use near-lossless for high quality
            alphaQuality: Math.max(quality - 10, 80) // Slightly lower alpha quality
          })
          .toBuffer();
        break;
        
      case 'avif':
        outputBuffer = await sharpInstance
          .avif({
            quality,
            effort: 9, // Max compression effort (0-9)
            chromaSubsampling: quality >= 85 ? '4:4:4' : '4:2:0'
          })
          .toBuffer();
        break;
        
      case 'jpeg':
        outputBuffer = await sharpInstance
          .jpeg({
            quality,
            progressive: enableProgressive,
            optimiseScans: true,
            optimiseCoding: true,
            mozjpeg: true, // Use mozjpeg encoder for better compression
            trellisQuantisation: true,
            overshootDeringing: true
          })
          .toBuffer();
        break;
        
      case 'png':
        outputBuffer = await sharpInstance
          .png({
            quality,
            compressionLevel: 9, // Max compression
            adaptiveFiltering: true,
            palette: quality < 90, // Use palette for lower quality
            colours: quality < 70 ? 64 : undefined // Reduce colors for very low quality
          })
          .toBuffer();
        break;
        
      default:
        // Default to WebP for unknown formats
        outputBuffer = await sharpInstance
          .webp({ quality, effort: 6 })
          .toBuffer();
    }

    // Calculate compression ratio with safe checks
    const originalSize = buffer?.length || 0;
    const compressedSize = outputBuffer?.length || 0;
    
    // Ensure we have valid numbers before calculation
    if (!originalSize || !compressedSize) {
      throw new Error(`Invalid buffer sizes: original=${originalSize}, compressed=${compressedSize}`);
    }
    
    const compressionDiff = originalSize - compressedSize;
    const compressionRatio = ((compressionDiff / originalSize) * 100).toFixed(1);
    
    return {
      resbuffer: outputBuffer,
      originalSize: formatFileSize(originalSize),
      compressedSize: formatFileSize(compressedSize),
      originalSizeBytes: originalSize,
      compressedSizeBytes: compressedSize,
      compressionRatio: `${compressionRatio}%`,
      format: finalFormat,
      // dimensions: { width: newWidth, height: newHeight }
    };
    
  } catch (error) {
    throw new Error(`Image compression failed: ${error.message}`);
  }
};

// Helper function for automatic format selection based on content
const getOptimalFormat = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    const { channels, density, hasAlpha } = metadata;
    
    // Use PNG for images with transparency
    if (hasAlpha) {
      return 'png';
    }
    
    // Use AVIF for photos with high detail
    if (channels >= 3 && density > 150) {
      return 'avif';
    }
    
    // Use WebP for general purpose
    if (channels >= 3) {
      return 'webp';
    }
    
    // Use PNG for simple graphics
    return 'png';
  } catch {
    return 'webp'; // Fallback
  }
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};