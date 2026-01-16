require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

let gcsBucket = null;

if (process.env.GCS_CREDENTIALS && process.env.GCS_BUCKET_NAME) {
  try {
    const credentials = JSON.parse(process.env.GCS_CREDENTIALS);
    const storage = new Storage({
      credentials: credentials
    });
    gcsBucket = storage.bucket(process.env.GCS_BUCKET_NAME);
    console.log('✅ Google Cloud Storage initialized');
  } catch (error) {
    console.log('⚠️ Google Cloud Storage not configured:', error.message);
  }
}

module.exports = gcsBucket;
