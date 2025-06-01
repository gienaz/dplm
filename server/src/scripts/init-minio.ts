import { Client } from 'minio';
import config from '../../config';

async function initMinIO() {
  console.log('Initializing MinIO...');
  
  const minioClient = new Client({
    endPoint: config.minio.endPoint,
    port: config.minio.port,
    useSSL: config.minio.useSSL,
    accessKey: config.minio.accessKey,
    secretKey: config.minio.secretKey
  });

  try {
    // Проверяем существование бакета
    const bucketExists = await minioClient.bucketExists(config.minio.bucket);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${config.minio.bucket}`);
      await minioClient.makeBucket(config.minio.bucket, 'us-east-1');
      
      // Настраиваем политику доступа для публичного чтения
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:GetObject'],
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Resource: [`arn:aws:s3:::${config.minio.bucket}/*`],
            Sid: 'PublicRead'
          }
        ]
      };
      
      await minioClient.setBucketPolicy(config.minio.bucket, JSON.stringify(policy));
      console.log(`Bucket policy set for ${config.minio.bucket}`);
    } else {
      console.log(`Bucket ${config.minio.bucket} already exists`);
    }
    
    console.log('MinIO initialization completed successfully');
  } catch (error) {
    console.error('Error initializing MinIO:', error);
    throw error;
  }
}

// Вызов функции если скрипт запущен напрямую
if (require.main === module) {
  initMinIO()
    .then(() => {
      console.log('MinIO setup completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Failed to initialize MinIO:', err);
      process.exit(1);
    });
}

export default initMinIO; 