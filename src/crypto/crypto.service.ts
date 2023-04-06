import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import { Types } from 'mongoose';

@Injectable()
export class CryptoService {
  private key = CryptoJS.enc.Hex.parse(process.env.AES_KEY);
  private iv = CryptoJS.enc.Hex.parse(process.env.AES_IV);

  async encryptUserId(userId: string | Types.ObjectId): Promise<string> {
    const cypherText = await CryptoJS.AES.encrypt(userId.toString(), this.key, {
      iv: this.iv,
    });
    return cypherText.toString().replace(/\//g, '_').replace(/\+/g, '-');
  }

  async decryptUserId(cypherText: string): Promise<number> {
    const bytes = await CryptoJS.AES.decrypt(
      cypherText.replace(/_/g, '/').replace(/-/g, '+'),
      this.key,
      {
        iv: this.iv,
      },
    );
    if (!bytes.toString(CryptoJS.enc.Utf8))
      throw new HttpException('non valid user id!', HttpStatus.BAD_REQUEST);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
