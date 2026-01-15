import { Test, TestingModule } from '@nestjs/testing';
import { ActionLogController } from './action-log.controller';
import { ActionLogService } from './action-log.service';
import { UnauthorizedException } from '@nestjs/common';
import { GetActionLogDto } from './dto/get-action-logs.dto';

describe('ActionLogController', () => {
	let controller: ActionLogController;
	let actionLogService: ActionLogService;

	const mockActionLogService = {
		getActionLogs: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ActionLogController],
			providers: [
				{
					provide: ActionLogService,
					useValue: mockActionLogService,
				},
			],
		}).compile();

		controller = module.get<ActionLogController>(ActionLogController);
		actionLogService = module.get<ActionLogService>(ActionLogService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getActionLogs', () => {
		it('should return action logs when user is admin', async () => {
			const getActionLogDto = {
				page: 1,
				limit: 10,
				user_id: 1,
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			const mockLogs = [
				{
					id: 1,
					user_id: 1,
					action: 'CREATE_DEVICE',
					entity_type: 'device',
					entity_id: '123456789012345',
					timestamp: new Date('2025-01-01'),
					details: 'Device created successfully',
				},
				{
					id: 2,
					user_id: 1,
					action: 'UPDATE_DEVICE',
					entity_type: 'device',
					entity_id: '123456789012345',
					timestamp: new Date('2025-01-02'),
					details: 'Device updated',
				},
			];

			mockActionLogService.getActionLogs.mockResolvedValue(mockLogs);

			const result = await controller.getActionLogs(mockRequest, getActionLogDto);

			expect(actionLogService.getActionLogs).toHaveBeenCalledWith(getActionLogDto);
			expect(result).toHaveProperty('statusCode', 200);
			expect(result).toHaveProperty('data', mockLogs);
			expect(result.data).toHaveLength(2);
		});

		it('should throw UnauthorizedException for non-admin users', async () => {
			const getActionLogDto = {
				page: 1,
				limit: 10,
			} as any;

			const mockRequest = {
				user: { id: 2, access_functions: { cm: true } },
			} as any;

			await expect(controller.getActionLogs(mockRequest, getActionLogDto)).rejects.toThrow(UnauthorizedException);
			expect(actionLogService.getActionLogs).not.toHaveBeenCalled();
		});

		it('should return empty array when no logs exist', async () => {
			const getActionLogDto = {
				page: 1,
				limit: 10,
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			mockActionLogService.getActionLogs.mockResolvedValue([]);

			const result = await controller.getActionLogs(mockRequest, getActionLogDto);

			expect(actionLogService.getActionLogs).toHaveBeenCalledWith(getActionLogDto);
			expect(result).toHaveProperty('statusCode', 200);
			expect(result.data).toEqual([]);
		});

		it('should filter logs by user id', async () => {
			const getActionLogDto = {
				page: 1,
				limit: 10,
				user_id: 5,
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			const mockLogs = [
				{
					id: 10,
					user_id: 5,
					action: 'DELETE_USER',
					entity_type: 'user',
					entity_id: '10',
					timestamp: new Date('2025-01-05'),
				},
			];

			mockActionLogService.getActionLogs.mockResolvedValue(mockLogs);

			const result = await controller.getActionLogs(mockRequest, getActionLogDto);

			expect(actionLogService.getActionLogs).toHaveBeenCalledWith(getActionLogDto);
			expect(result.data).toHaveLength(1);
			expect((result.data as any)[0].user_id).toBe(5);
		});

		it('should handle pagination correctly', async () => {
			const getActionLogDto = {
				page: 2,
				limit: 5,
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			const mockLogs = Array.from({ length: 5 }, (_, i) => ({
				id: i + 6,
				user_id: 1,
				action: `ACTION_${i + 6}`,
				entity_type: 'device',
				entity_id: `device_${i + 6}`,
				timestamp: new Date('2025-01-01'),
			}));

			mockActionLogService.getActionLogs.mockResolvedValue(mockLogs);

			const result = await controller.getActionLogs(mockRequest, getActionLogDto);

			expect(actionLogService.getActionLogs).toHaveBeenCalledWith(getActionLogDto);
			expect(result.data).toHaveLength(5);
		});

		it('should filter logs by action type', async () => {
			const getActionLogDto = {
				page: 1,
				limit: 10,
				action: 'CREATE_DEVICE',
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			const mockLogs = [
				{
					id: 1,
					user_id: 1,
					action: 'CREATE_DEVICE',
					entity_type: 'device',
					entity_id: '123',
					timestamp: new Date('2025-01-01'),
				},
			];

			mockActionLogService.getActionLogs.mockResolvedValue(mockLogs);

			const result = await controller.getActionLogs(mockRequest, getActionLogDto);

			expect(actionLogService.getActionLogs).toHaveBeenCalledWith(getActionLogDto);
			expect(result.data).toHaveLength(1);
			expect((result.data as any)[0].action).toBe('CREATE_DEVICE');
		});

		it('should filter logs by entity type', async () => {
			const getActionLogDto = {
				page: 1,
				limit: 10,
				entity_type: 'user',
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			const mockLogs = [
				{
					id: 1,
					user_id: 1,
					action: 'CREATE_USER',
					entity_type: 'user',
					entity_id: '5',
					timestamp: new Date('2025-01-01'),
				},
			];

			mockActionLogService.getActionLogs.mockResolvedValue(mockLogs);

			const result = await controller.getActionLogs(mockRequest, getActionLogDto);

			expect(actionLogService.getActionLogs).toHaveBeenCalledWith(getActionLogDto);
			expect((result.data as any)[0].entity_type).toBe('user');
		});

		it('should filter logs by date range', async () => {
			const getActionLogDto = {
				page: 1,
				limit: 10,
				start_date: '2025-01-01',
				end_date: '2025-01-31',
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			const mockLogs = [
				{
					id: 1,
					user_id: 1,
					action: 'UPDATE_DEVICE',
					timestamp: new Date('2025-01-15'),
				},
			];

			mockActionLogService.getActionLogs.mockResolvedValue(mockLogs);

			const result = await controller.getActionLogs(mockRequest, getActionLogDto);

			expect(actionLogService.getActionLogs).toHaveBeenCalledWith(getActionLogDto);
			expect(result.data).toHaveLength(1);
		});

		it('should handle service errors gracefully', async () => {
			const getActionLogDto = {
				page: 1,
				limit: 10,
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			mockActionLogService.getActionLogs.mockRejectedValue(new Error('Database error'));

			await expect(controller.getActionLogs(mockRequest, getActionLogDto)).rejects.toThrow('Database error');
			expect(actionLogService.getActionLogs).toHaveBeenCalledWith(getActionLogDto);
		});

		it('should return logs with complete details', async () => {
			const getActionLogDto = {
				page: 1,
				limit: 10,
			} as any;

			const mockRequest = {
				user: { id: 1, access_functions: { admin: true } },
			} as any;

			const mockLogs = [
				{
					id: 1,
					user_id: 1,
					action: 'UPDATE_SHIPMENT',
					entity_type: 'shipment',
					entity_id: 'SHIP001',
					timestamp: new Date('2025-01-01'),
					details: {
						old_status: 'pending',
						new_status: 'shipped',
						items: 5,
					},
					ip_address: '192.168.1.1',
					user_agent: 'Mozilla/5.0',
				},
			];

			mockActionLogService.getActionLogs.mockResolvedValue(mockLogs);

			const result = await controller.getActionLogs(mockRequest, getActionLogDto);

			expect((result.data as any)[0]).toHaveProperty('details');
			expect((result.data as any)[0]).toHaveProperty('ip_address');
			expect((result.data as any)[0]).toHaveProperty('user_agent');
		});
	});
});
