import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthCaptchaService } from '../auth/auth-captcha/auth-captcha.service';
import { UnauthorizedException } from '@nestjs/common';
import { ErrorKeys } from 'src/common/api-response';

// Mock hasAccessFunction
jest.mock('../auth/auth.service', () => ({
	hasAccessFunction: jest.fn((req, accessFunction) => {
		return req.user?.access_functions?.[accessFunction] === true;
	}),
}));

describe('UsersController', () => {
	let controller: UsersController;
	let usersService: UsersService;
	let authCaptchaService: AuthCaptchaService;

	const mockUsersService = {
		create: jest.fn(),
		update: jest.fn(),
		changeUserPassword: jest.fn(),
		updateUserAccessFunctions: jest.fn(),
		getAccessFunctions: jest.fn(),
		deleteUser: jest.fn(),
		getUsers: jest.fn(),
		forgotPassword: jest.fn(),
		resetUserPassword: jest.fn(),
		updateUserPassword: jest.fn(),
	};

	const mockAuthCaptchaService = {
		getCaptcha: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			providers: [
				{
					provide: UsersService,
					useValue: mockUsersService,
				},
				{
					provide: AuthCaptchaService,
					useValue: mockAuthCaptchaService,
				},
			],
		}).compile();

		controller = module.get<UsersController>(UsersController);
		usersService = module.get<UsersService>(UsersService);
		authCaptchaService = module.get<AuthCaptchaService>(AuthCaptchaService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('registerUser', () => {
		it('should register a user successfully', async () => {
			const createUserDto = { username: 'testuser', email: 'test@example.com', password: 'password123' } as any;
			const mockRequest = {} as any;
			const expectedResult = { id: 1, username: 'testuser' };
			mockUsersService.create.mockResolvedValue(expectedResult);

			const result = await controller.registerUser(createUserDto, mockRequest);

			expect(usersService.create).toHaveBeenCalledWith(createUserDto, { req: mockRequest });
			expect(result).toEqual(expectedResult);
		});

		it('should handle registration errors', async () => {
			const createUserDto = { username: 'existing', email: 'existing@example.com', password: 'password123' } as any;
			const mockRequest = {} as any;
			mockUsersService.create.mockResolvedValue({ err: ErrorKeys.UNIQUE_VIOLATION_EMAIL });

			await expect(controller.registerUser(createUserDto, mockRequest)).rejects.toThrow();
		});
	});

	describe('update', () => {
		it('should allow admin to update any user', async () => {
			const updateUserDto = { name: 'Updated' } as any;
			const mockRequest = { user: { id: 1, access_functions: { admin: true } } } as any;
			const expectedResult = { res: { id: 2, name: 'Updated' } };
			mockUsersService.update.mockResolvedValue(expectedResult);

			const result = await controller.update(mockRequest, 2, updateUserDto);

			expect(usersService.update).toHaveBeenCalledWith(2, updateUserDto, { req: mockRequest });
			expect(result).toHaveProperty('statusCode', 200);
		});

		it('should allow user to update their own profile', async () => {
			const updateUserDto = { name: 'Updated' } as any;
			const mockRequest = { user: { id: 1, access_functions: {} } } as any;
			const expectedResult = { res: { id: 1, name: 'Updated' } };
			mockUsersService.update.mockResolvedValue(expectedResult);

			const result = await controller.update(mockRequest, 1, updateUserDto);

			expect(usersService.update).toHaveBeenCalledWith(1, updateUserDto, { req: mockRequest });
			expect(result).toHaveProperty('statusCode', 200);
		});

		it('should throw UnauthorizedException when non-admin tries to update other user', async () => {
			const updateUserDto = { name: 'Updated' } as any;
			const mockRequest = { user: { id: 1, access_functions: {} } } as any;

			await expect(controller.update(mockRequest, 2, updateUserDto)).rejects.toThrow(UnauthorizedException);
		});

		it('should handle update errors', async () => {
			const updateUserDto = { name: 'Updated' } as any;
			const mockRequest = { user: { id: 1, access_functions: {} } } as any;
			mockUsersService.update.mockResolvedValue({ err: ErrorKeys.INVALID_USER });

			await expect(controller.update(mockRequest, 1, updateUserDto)).rejects.toThrow();
		});
	});

	describe('changeUserPassword', () => {
		it('should change password successfully', async () => {
			const changePasswordDto = { id: 1, oldPassword: 'oldpass', newPassword: 'newpass' } as any;
			const mockRequest = { user: { id: 1, access_functions: {} } } as any;
			const expectedResult = { res: { success: true } };
			mockUsersService.changeUserPassword.mockResolvedValue(expectedResult);

			const result = await controller.changeUserPassword(changePasswordDto, mockRequest);

			expect(usersService.changeUserPassword).toHaveBeenCalledWith(1, changePasswordDto);
			expect(result).toHaveProperty('statusCode', 200);
		});

		it('should handle password change errors', async () => {
			const changePasswordDto = { id: 1, oldPassword: 'wrongpass', newPassword: 'newpass' } as any;
			const mockRequest = { user: { id: 1, access_functions: {} } } as any;
			mockUsersService.changeUserPassword.mockResolvedValue({ err: ErrorKeys.INCORRECT_OLD_PASSWORD });

			await expect(controller.changeUserPassword(changePasswordDto, mockRequest)).rejects.toThrow();
		});
	});

	describe('updateUserAccessFunctions', () => {
		it('should allow admin to update access functions', async () => {
			const updateAccessFunctionsDto = { userId: 2, access_functions: { admin: false, cm: true } } as any;
			const mockRequest = { user: { id: 1, access_functions: { admin: true } } } as any;
			const expectedResult = { res: { id: 2, access_functions: { admin: false, cm: true } } };
			mockUsersService.updateUserAccessFunctions.mockResolvedValue(expectedResult);

			const result = await controller.updateUserAccessFunctions(updateAccessFunctionsDto, mockRequest);

			expect(usersService.updateUserAccessFunctions).toHaveBeenCalledWith(updateAccessFunctionsDto, mockRequest);
			expect(result).toHaveProperty('statusCode', 200);
		});

		it('should throw UnauthorizedException for non-admin', async () => {
			const updateAccessFunctionsDto = { userId: 2, access_functions: { admin: true } } as any;
			const mockRequest = { user: { id: 2, access_functions: {} } } as any;

			await expect(controller.updateUserAccessFunctions(updateAccessFunctionsDto, mockRequest)).rejects.toThrow(UnauthorizedException);
		});

		it('should handle update errors', async () => {
			const updateAccessFunctionsDto = { userId: 999, access_functions: { admin: true } } as any;
			const mockRequest = { user: { id: 1, access_functions: { admin: true } } } as any;
			mockUsersService.updateUserAccessFunctions.mockResolvedValue({ err: ErrorKeys.INVALID_USER });

			await expect(controller.updateUserAccessFunctions(updateAccessFunctionsDto, mockRequest)).rejects.toThrow();
		});
	});

	describe('getCurrentUserAccessFunctions', () => {
		it('should return current user access functions', async () => {
			const mockRequest = { user: { id: 1, access_functions: { admin: true, cm: true } } } as any;

			const result = await controller.getCurrentUserAccessFunctions(mockRequest);

			expect(result).toHaveProperty('statusCode', 200);
			expect(result).toHaveProperty('data');
			expect(result.data).toHaveProperty('admin', true);
			expect(result.data).toHaveProperty('cm', true);
		});
	});

	describe('delete', () => {
		it('should allow admin to delete user', async () => {
			const mockRequest = { user: { id: 1, access_functions: { admin: true } } } as any;
			mockUsersService.deleteUser.mockResolvedValue(undefined);

			const result = await controller.delete(mockRequest, 2);

			expect(usersService.deleteUser).toHaveBeenCalledWith(2, { req: mockRequest });
			expect(result).toHaveProperty('statusCode', 200);
		});

		it('should throw UnauthorizedException for non-admin', async () => {
			const mockRequest = { user: { id: 1, access_functions: {} } } as any;

			await expect(controller.delete(mockRequest, 2)).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('listUsers', () => {
		it('should allow admin to list users', async () => {
			const mockRequest = { user: { id: 1, access_functions: { admin: true } } } as any;
			const filters = { page: 1, limit: 10 } as any;
			const expectedResult = [{ id: 1, username: 'user1' }, { id: 2, username: 'user2' }];
			mockUsersService.getUsers.mockResolvedValue(expectedResult);

			const result = await controller.listUsers(mockRequest, filters);

			expect(usersService.getUsers).toHaveBeenCalledWith(filters);
			expect(result).toHaveProperty('statusCode', 200);
			expect(result).toHaveProperty('data');
			expect(result.data).toEqual(expectedResult);
		});

		it('should throw UnauthorizedException for non-admin', async () => {
			const mockRequest = { user: { id: 1, access_functions: {} } } as any;
			const filters = {} as any;

			await expect(controller.listUsers(mockRequest, filters)).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('forgotPassword', () => {
		it('should send forgot password email successfully', async () => {
			const forgotPasswordDto = { email: 'test@example.com' } as any;
			const mockRequest = {} as any;
			const expectedResult = { success: true };
			mockUsersService.forgotPassword.mockResolvedValue(expectedResult);

			const result = await controller.forgotPassword(mockRequest, forgotPasswordDto);

			expect(usersService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto, { req: mockRequest });
			expect(result).toHaveProperty('statusCode', 200);
		});

		it('should handle forgot password errors', async () => {
			const forgotPasswordDto = { email: 'nonexistent@example.com' } as any;
			const mockRequest = {} as any;
			mockUsersService.forgotPassword.mockResolvedValue({ err: ErrorKeys.INVALID_USER });

			await expect(controller.forgotPassword(mockRequest, forgotPasswordDto)).rejects.toThrow();
		});
	});

	describe('getCaptchaImage', () => {
		it('should return captcha image', async () => {
			const captchaKey = 'test-key';
			const mockSvg = '<svg>captcha</svg>';
			mockAuthCaptchaService.getCaptcha.mockResolvedValue(mockSvg);

			const mockResponse = {
				header: jest.fn(),
				send: jest.fn(),
			} as any;

			await controller.getCaptchaImage(captchaKey, mockResponse);

			expect(authCaptchaService.getCaptcha).toHaveBeenCalledWith(captchaKey, true);
			expect(mockResponse.header).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
			expect(mockResponse.header).toHaveBeenCalledWith('Cache-Control', 'no-store');
			expect(mockResponse.send).toHaveBeenCalledWith(mockSvg);
		});
	});

	describe('resetPassword', () => {
		it('should reset password successfully', async () => {
			const resetPasswordDto = { token: 'reset-token', newPassword: 'newpass' } as any;
			const mockRequest = {} as any;
			const expectedResult = { res: { success: true } };
			mockUsersService.resetUserPassword.mockResolvedValue(expectedResult);

			const result = await controller.resetPassword(mockRequest, resetPasswordDto);

			expect(usersService.resetUserPassword).toHaveBeenCalledWith(resetPasswordDto, { req: mockRequest });
			expect(result).toHaveProperty('statusCode', 200);
		});

		it('should handle reset password errors', async () => {
			const resetPasswordDto = { token: 'invalid-token', newPassword: 'newpass' } as any;
			const mockRequest = {} as any;
			mockUsersService.resetUserPassword.mockResolvedValue({ err: ErrorKeys.RESET_PASSWORD_LINK_EXPIRED });

			await expect(controller.resetPassword(mockRequest, resetPasswordDto)).rejects.toThrow();
		});
	});

	describe('updateUserPassword', () => {
		it('should allow admin to update user password', async () => {
			const updatePasswordDto = { userId: 2, newPassword: 'newpass' } as any;
			const mockRequest = { user: { id: 1, access_functions: { admin: true } } } as any;
			const expectedResult = { res: { success: true } };
			mockUsersService.updateUserPassword.mockResolvedValue(expectedResult);

			const result = await controller.updateUserPassword(mockRequest, updatePasswordDto);

			expect(usersService.updateUserPassword).toHaveBeenCalledWith(updatePasswordDto, { req: mockRequest });
			expect(result).toHaveProperty('statusCode', 200);
		});

		it('should throw UnauthorizedException for non-admin', async () => {
			const updatePasswordDto = { userId: 2, newPassword: 'newpass' } as any;
			const mockRequest = { user: { id: 2, access_functions: {} } } as any;

			await expect(controller.updateUserPassword(mockRequest, updatePasswordDto)).rejects.toThrow(UnauthorizedException);
		});

		it('should handle update password errors', async () => {
			const updatePasswordDto = { userId: 999, newPassword: 'newpass' } as any;
			const mockRequest = { user: { id: 1, access_functions: { admin: true } } } as any;
			mockUsersService.updateUserPassword.mockResolvedValue({ err: ErrorKeys.INVALID_USER });

			await expect(controller.updateUserPassword(mockRequest, updatePasswordDto)).rejects.toThrow();
		});
	});
});
