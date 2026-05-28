const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const testUpload = async () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  console.log("Creating client for", accountId);

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  try {
    console.log("Sending command...");
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: "test-file.txt",
      Body: "Hello R2",
      ContentType: "text/plain",
    });

    const res = await s3Client.send(command);
    console.log("Success:", res);
  } catch (err) {
    console.error("S3 Error:", err);
  }
};

testUpload();
