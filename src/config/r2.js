/**
 * @file r2.js
 * @description Cấu hình kết nối Cloudflare R2 Client sử dụng AWS SDK v3 chuẩn S3 API.
 */
import { S3Client } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto", 
  endpoint: process.env.R2_ENDPOINT, 
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default r2Client;