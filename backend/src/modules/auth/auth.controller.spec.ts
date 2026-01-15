import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
	let controller: AuthController;
	let authService: AuthService;

	const mockAuthService = {
		login: jest.fn(),
		logout: jest.fn(),
		refreshAccessToken: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
			],
		}).compile();

		controller = module.get<AuthController>(AuthController);
		authService = module.get<AuthService>(AuthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('login', () => {
		it('should call authService.login and return the result', async () => {
			const mockRequest = {
				user: { id: 1, username: 'testuser', email: 'test@example.com' },
			} as any;

			const expectedResult = {
				access_token: 'mock_access_token',
				refresh_token: 'mock_refresh_token',
				user: mockRequest.user,
			};

			mockAuthService.login.mockResolvedValue(expectedResult);

			const result = await controller.login(mockRequest);

			expect(authService.login).toHaveBeenCalledWith(mockRequest.user, { req: mockRequest });
			expect(result).toEqual(expectedResult);
		});

		it('should handle login with different user data', async () => {
			const mockRequest = {
				user: { id: 2, username: 'admin', email: 'admin@example.com' },
			} as any;

			const expectedResult = {
				access_token: 'admin_access_token',
				refresh_token: 'admin_refresh_token',
				user: mockRequest.user,
			};

			mockAuthService.login.mockResolvedValue(expectedResult);

			const result = await controller.login(mockRequest);

			expect(authService.login).toHaveBeenCalledWith(mockRequest.user, { req: mockRequest });
			expect(result).toEqual(expectedResult);
		});

		it('should throw error if login fails', async () => {
			const mockRequest = {
				user: { id: 1, username: 'testuser' },
			} as any;

			mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

			await expect(controller.login(mockRequest)).rejects.toThrow(UnauthorizedException);
			expect(authService.login).toHaveBeenCalledWith(mockRequest.user, { req: mockRequest });
		});
	});

	describe('logout', () => {
		it('should call authService.logout and return success message', async () => {
			const mockRequest = {
				user: { id: 1, username: 'testuser' },
			} as any;

			mockAuthService.logout.mockResolvedValue(undefined);

			const result = await controller.logout(mockRequest);

			expect(authService.logout).toHaveBeenCalledWith(mockRequest);
			expect(result).toHaveProperty('statusCode', 200);
			expect(result).toHaveProperty('message');
		});

		it('should handle logout errors', async () => {
			const mockRequest = {
				user: { id: 1, username: 'testuser' },
			} as any;

			mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

			await expect(controller.logout(mockRequest)).rejects.toThrow('Logout failed');
			expect(authService.logout).toHaveBeenCalledWith(mockRequest);
		});
	});

	describe('refreshToken', () => {
		it('should call authService.refreshAccessToken and return new tokens', async () => {
			const mockRequest = {
				user: { id: 1, username: 'testuser', refresh_token: 'old_refresh_token' },
			} as any;

			const expectedResult = {
				access_token: 'new_access_token',
				refresh_token: 'new_refresh_token',
			};

			mockAuthService.refreshAccessToken.mockResolvedValue(expectedResult);

			const result = await controller.refreshToken(mockRequest);

			expect(authService.refreshAccessToken).toHaveBeenCalledWith(mockRequest.user);
			expect(result).toEqual(expectedResult);
		});

		it('should handle refresh token errors', async () => {
			const mockRequest = {
				user: { id: 1, username: 'testuser', refresh_token: 'invalid_token' },
			} as any;

			mockAuthService.refreshAccessToken.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

			await expect(controller.refreshToken(mockRequest)).rejects.toThrow(UnauthorizedException);
			expect(authService.refreshAccessToken).toHaveBeenCalledWith(mockRequest.user);
		});

		it('should return new tokens for valid refresh token', async () => {
			const mockRequest = {
				user: { id: 2, username: 'admin', refresh_token: 'valid_refresh_token' },
			} as any;

			const expectedResult = {
				access_token: 'admin_new_access_token',
				refresh_token: 'admin_new_refresh_token',
			};

			mockAuthService.refreshAccessToken.mockResolvedValue(expectedResult);

			const result = await controller.refreshToken(mockRequest);

			expect(authService.refreshAccessToken).toHaveBeenCalledWith(mockRequest.user);
			expect(result).toEqual(expectedResult);
		});
	});
});
