import { Injectable } from '@nestjs/common';
import { uploadFromBuffer as uploadFromBufferUtil } from '../utils/cloudinary/cloudinary.util';

const DEFAULT_FOLDER = 'planify-profiles';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File & { buffer?: Buffer },
    folder: string = DEFAULT_FOLDER,
  ): Promise<string> {
    const buffer = file.buffer ?? (file as any).buffer;
    if (!buffer) {
      throw new Error('File buffer is required. Use memoryStorage() in Multer.');
    }
    return uploadFromBufferUtil(buffer, folder);
  }

  async uploadFromBuffer(buffer: Buffer, folder: string = DEFAULT_FOLDER): Promise<string> {
    return uploadFromBufferUtil(buffer, folder);
  }
}
