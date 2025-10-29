import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

// Local storage fallback function
async function uploadToLocal(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Create subdirectories based on key path
  const filePath = path.join(uploadsDir, key);
  const fileDir = path.dirname(filePath);
  
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }
  
  // Write file to disk
  fs.writeFileSync(filePath, buffer);
  
  // Return public URL path
  return `/uploads/${key}`;
}

export async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  
  // If AWS S3 is not configured, use local storage as fallback
  if (!bucket || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('AWS S3 not configured, using local storage fallback');
    return uploadToLocal(buffer, key, contentType);
  }

  try {
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      signatureVersion: 'v4',
    });

    await s3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      })
      .promise();

    return `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 upload failed, falling back to local storage:', error);
    // Fallback to local storage if S3 upload fails
    return uploadToLocal(buffer, key, contentType);
  }
}


