const bucket = require("../config/firebase"); // wherever you exported it
const { v4: uuidv4 } = require("uuid"); // to generate a unique file name
const path = require("path");

/**
 * Upload buffer to Firebase Storage
 */
exports.uploadToFirebase = async ({ buffer, originalName, format }) => {
    try {

        if (!buffer) {
            throw new TypeError("Missing buffer for upload.");
        }

        // Convert ArrayBuffer to Buffer if necessary
        const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

        const extension = format || "webp";
        const filename = `${uuidv4()}.${extension}`;
        const firebasePath = `producers/${filename}`;
        
        const file = bucket.bucket.file(firebasePath);
        
        // Method 1: Using file.save() - Recommended for buffers
        if (!nodeBuffer || !Buffer.isBuffer(nodeBuffer)) {
            throw new TypeError("Invalid or missing buffer for upload.");
        }

        await file.save(nodeBuffer, {
            metadata: {
                contentType: `image/${extension}`,
                metadata: {
                    originalName: originalName || 'unknown',
                    uploadedAt: new Date().toISOString()
                }
            }
        });

        // Make the file publicly accessible
        await file.makePublic();
        const publicUrl = file.publicUrl();
        
        return { 
            filename, 
            publicUrl,
            firebasePath 
        };
        
    } catch (error) {
        console.error('Firebase upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};