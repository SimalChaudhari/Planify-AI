import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const DEFAULT_FOLDER = 'planify-profiles';

function getConfig() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error('Cloudinary env (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET) are required.');
  }
  return { cloud_name, api_key, api_secret };
}

export function initCloudinary(): void {
  const { cloud_name, api_key, api_secret } = getConfig();
  cloudinary.config({ cloud_name, api_key, api_secret });
}

/**
 * Upload image buffer to Cloudinary and return secure URL.
 */
export function uploadFromBuffer(
  buffer: Buffer,
  folder: string = DEFAULT_FOLDER,
): Promise<string> {
  initCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result: UploadApiResponse | undefined) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error('No URL returned from Cloudinary'));
        resolve(result.secure_url);
      },
    );
    uploadStream.end(buffer);
  });
}
