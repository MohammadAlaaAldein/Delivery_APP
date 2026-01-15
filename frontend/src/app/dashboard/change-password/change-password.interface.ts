export interface ChangePassword {
    userId: number;
    newPassword: string;
    confirmPassword: string;
    encKey: string;
}
