import { Test, TestingModule } from '@nestjs/testing';
import { ApiLogsController } from './api-logs.controller';
import { ApiLogsService } from './api-logs.service';
import { UnauthorizedException } from '@nestjs/common';
import { ListApiLogsDto } from './dto/list-logs.dto';

describe('ApiLogsController', () => {
	let controller: ApiLogsController;
	let apiLogsService: ApiLogsService;

	const mockApiLogsService = {
		getLogs: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ApiLogsController],
			providers: [
				{
					provide: ApiLogsService,
					useValue: mockApiLogsService,
				},
			],
		}).compile();

		controller = module.get<ApiLogsController>(ApiLogsController);
		apiLogsService = module.get<ApiLogsService>(ApiLogsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('apiLogs', () => {
		it('should return API logs when user is admin', async () => {
			const filters = {
				page: 1,
				limit: 10,
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			const mockLogs = [
				{
					id: 1,
					method: 'POST',
					url: '/api/devices/add-device',
					status_code: 200,
					response_time: 150,
					user_id: 1,
					timestamp: new Date('2025-01-01'),
				},
				{
					id: 2,
					method: 'GET',
					url: '/api/devices/search-devices',
					status_code: 200,
					response_time: 75,
					user_id: 1,
					timestamp: new Date('2025-01-02'),
				},
			];

			mockApiLogsService.getLogs.mockResolvedValue(mockLogs);

			const result = await controller.apiLogs(mockRequest, filters);

			expect(apiLogsService.getLogs).toHaveBeenCalledWith(filters);
			expect(result).toHaveProperty('statusCode', 200);
			expect(result).toHaveProperty('data', mockLogs);
			expect(result.data).toHaveLength(2);
		});

		it('should throw UnauthorizedException for non-admin users', async () => {
			const filters = {
				page: 1,
				limit: 10,
			} as any;

			const mockRequest = {
				user: { id: 2, access_functions: { cm: true } },
			} as any;

			await expect(controller.apiLogs(mockRequest, filters)).rejects.toThrow(UnauthorizedException);
			expect(apiLogsService.getLogs).not.toHaveBeenCalled();
		});

		it('should return empty array when no logs exist', async () => {
			const filters = {
				page: 1,
				limit: 10,
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			mockApiLogsService.getLogs.mockResolvedValue([]);

			const result = await controller.apiLogs(mockRequest, filters);

			expect(apiLogsService.getLogs).toHaveBeenCalledWith(filters);
			expect(result).toHaveProperty('statusCode', 200);
			expect(result.data).toEqual([]);
		});

		it('should filter logs by method', async () => {
			const filters = {
				page: 1,
				limit: 10,
				method: 'POST',
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			const mockLogs = [
				{
					id: 1,
					method: 'POST',
					url: '/api/devices/add-device',
					status_code: 200,
				},
			];

			mockApiLogsService.getLogs.mockResolvedValue(mockLogs);

			const result = await controller.apiLogs(mockRequest, filters);

			expect(apiLogsService.getLogs).toHaveBeenCalledWith(filters);
			expect(result.data).toHaveLength(1);
		});

		it('should handle service errors gracefully', async () => {
			const filters = {
				page: 1,
				limit: 10,
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			mockApiLogsService.getLogs.mockRejectedValue(new Error('Database error'));

			await expect(controller.apiLogs(mockRequest, filters)).rejects.toThrow('Database error');
			expect(apiLogsService.getLogs).toHaveBeenCalledWith(filters);
		});
	});
});
