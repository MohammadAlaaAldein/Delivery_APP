import { Controller, Get, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { join } from 'path';
import * as fs from 'fs';

@Controller()
export class MainRouteController {
	@Get('*')
	handleUrlRoutes(@Res() reply: FastifyReply) {
		const indexFilePath = join(__dirname, '..', '..','..', 'frontend', 'dist', 'index.html');

		const htmlFile = fs.readFileSync(indexFilePath);
		reply.type('text/html').send(htmlFile);
	}
}