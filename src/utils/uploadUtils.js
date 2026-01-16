const cloudinary = require('../config/cloudinary');
const gcsBucket = require('../config/storage');
const fs = require('fs');
const path = require('path');

async function uploadAudioToCloudinary(audioBuffer, filename = `tts_${Date.now()}`) {
  const tempDir = path.join(__dirname, '../../temp/tts');
  const tempFilePath = path.join(tempDir, `${filename}.mp3`);

  try {
    console.log('💾 Saving audio file temporarily...');

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save buffer to file
    fs.writeFileSync(tempFilePath, audioBuffer);
    console.log('✅ Audio file saved:', tempFilePath);

    console.log('☁️ Uploading to Cloudinary...');

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: "auto",
      folder: "tts",
      public_id: filename,
      format: "mp3",
      overwrite: true,
    });

    console.log('✅ Upload successful:', result.secure_url);

    // Delete temp file
    fs.unlinkSync(tempFilePath);
    console.log('🗑️ Temp file deleted');

    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);

    // Clean up temp file on error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    throw error;
  }
}

async function uploadAudioToGCS(base64Audio, filename = `tts_${Date.now()}`) {
  if (!gcsBucket) {
    throw new Error('Google Cloud Storage not configured');
  }

  const tempDir = path.join(__dirname, '../../temp');
  const tempFilePath = path.join(tempDir, `${filename}.mp3`);
  const destination = `tts/${filename}.mp3`;

  try {
    console.log('💾 Saving audio file temporarily...');

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save buffer to file
    const buffer = Buffer.from(base64Audio, "base64");
    fs.writeFileSync(tempFilePath, buffer);
    console.log('✅ Audio file saved:', tempFilePath);

    console.log('☁️ Uploading to Google Cloud Storage...');

    // Upload file to GCS
    await gcsBucket.upload(tempFilePath, {
      destination: destination,
      metadata: {
        contentType: 'audio/mpeg'
      }
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${gcsBucket.name}/${destination}`;

    console.log('✅ Upload successful:', publicUrl);

    // Delete temp file
    fs.unlinkSync(tempFilePath);
    console.log('🗑️ Temp file deleted');

    return publicUrl;
  } catch (error) {
    console.error('❌ Google Cloud Storage upload error:', error.message);

    // Clean up temp file on error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    throw error;
  }
}

module.exports = { uploadAudioToCloudinary, uploadAudioToGCS };
