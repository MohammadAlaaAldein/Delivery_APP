import { Body, Controller, Delete, Post, Query, Req, Session, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { getControllersPrefixes } from 'src/common/utilities';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { AttachmentsService } from './attachments.service';
import { FastifyRequest } from 'fastify';
import { handleFiles } from 'src/common/common';
import { handleSuccessApiResponse, handleThrowApiError } from 'src/common/api-response';
import { hasAccessFunction } from '../auth/auth.service';
import { ACCESS_FUNCTIONS } from 'src/common/access-functions';

@Controller(getControllersPrefixes('attachments'))
@UseGuards(JwtGuard)
export class AttachmentsController {
	readonly THROW_API_MODULE: string = 'attachments';

	constructor(
		private attachmentsService: AttachmentsService,
	) { }

	@Post('add')
	async addAttachments(
		@Req() req: FastifyRequest,
	) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.ADMIN))
			throw new UnauthorizedException();

		const { files, fields } = await handleFiles(req.parts());

		const source = fields.source?.value;
		const sourceId = parseInt(fields.sourceId?.value || '0');
		const note = fields.note?.value || '';

		if (!files.length || !source || !sourceId)
			return handleThrowApiError(this.THROW_API_MODULE, '');

		const validation = this.attachmentsService.validate({ file: files[0], note });
		if (Object.keys(validation).length)
			return { validation };

		const result = await this.attachmentsService.addAttachments([files[0]], { source, sourceId, note, user_id: req.user.id, req });
		if (result.err)
			return handleSuccessApiResponse({ message: result.err });

		const attachment = result[0];
		attachment.user_name = `${req.user.name}`;

		return handleSuccessApiResponse({ data: attachment });
	}

	@Delete('delete-attachment')
	async deleteAttachment(
		@Req() req: FastifyRequest,
		@Query() query,
	) {
		const { source, sourceId, attachmentId } = query;

		if (!source || !sourceId || !attachmentId)
			return handleThrowApiError(this.THROW_API_MODULE, '');

		await this.attachmentsService.deleteAttachment(source, sourceId, attachmentId, { req, user_id: req.user.id });
		return 1;
	}

	@Post('download-attachments')
	async downloadAttachment(
		@Body() body,
		@Req() req: FastifyRequest
	) {
		const { source, attachmentNames } = body;

		if (!source || !attachmentNames.length)
			return handleThrowApiError(this.THROW_API_MODULE, '');

		return await this.attachmentsService.downloadAttachment(source, attachmentNames);
	}
}
