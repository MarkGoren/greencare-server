import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImages(images, fileName: string) {
    const uploadedImagesUrls = [];
    for (const image of images) {
      const { buffer } = image;
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: fileName },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        stream.write(buffer);
        stream.end();
      });

      uploadedImagesUrls.push(uploaded['secure_url']);
    }
    return uploadedImagesUrls;
  }
}
