import * as bcrypt from 'bcrypt';

export class EncryptionUtil {
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 12);
    }

    static async comparePassword(plain: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plain, hash);
    }
}
