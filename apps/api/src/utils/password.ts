
import bcrypt from "bcrypt";

const PASSWORD_SALT_ROUNDS = 12;

export const hashPassword = async (
    plainPassword: string,
): Promise<string> => {
    return bcrypt.hash(plainPassword, PASSWORD_SALT_ROUNDS);
};

export const verifyPassword = async (
    plainPassword: string,
    passwordHash: string,
): Promise<boolean> => {
    return bcrypt.compare(plainPassword, passwordHash);
};