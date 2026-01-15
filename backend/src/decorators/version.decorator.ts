import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Version = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): string => {
		const request = ctx.switchToHttp().getRequest();
		const url = request.url || '';
		
		// Split URL and filter empty parts
		const parts = url.split('/').filter(Boolean);
		
		let version = '1'; // Default version
		
		// Check second part (covers /api/v1/...)
		if (parts[1]?.match(/^v\d+$/)) {
			version = parts[1].replace(/^v/, '');
		}
		// Check first part (covers /v1/api/...)
		else if (parts[0]?.match(/^v\d+$/)) {
			version = parts[0].replace(/^v/, '');
		}
		
		return version;
	},
);
