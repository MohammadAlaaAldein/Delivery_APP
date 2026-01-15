import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderAttachments } from '../shipment/order/entities/order-attachments.entity';
import { Repository } from 'typeorm/repository/Repository';
import { FilesService } from '../files/files.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AttachmentsService {
	readonly maxFileSize: number = 20 * 1048576; // 1 MB in bytes * 20
	readonly maxNoteCharacters: number = 200;
	readonly allowedUploadFilesExt: string[] = [
		'docx', 'doc',
		'xls', 'xlsx',
		'ppt', 'pptx',
		'txt', 'csv',
		'jpeg', 'jpg',
		'png', 'pdf',
	];

	constructor(
		@InjectRepository(OrderAttachments)
		private readonly orderAttachmentsRepository: Repository<OrderAttachments>,
		private readonly filesService: FilesService,
		private readonly eventEmitter: EventEmitter2,
	) { }

	async addAttachments(files: any[], options: { source: string, sourceId: number | string | string[] | number[], note: string, user_id: number, req: any }) {
		try {
			const config: any = this.getAttachmentsConfig(options.source, options.sourceId);

			const isExists = await this.checkAttachmentsExists(options.source, options.sourceId, files);
			if (isExists)
				return { err: 'file_already_exists' };

			// Insert to DB
			const sqlValues = [];
			for (const file of files) {
				const fileName = file.filename || '';
				sqlValues.push({ [config.sourceIdColumn]: config.sourceId, file_name: fileName, note: options.note, user_id: options.user_id });
			}

			const res = await config.qb.createQueryBuilder().insert().values(sqlValues).returning('*').execute();

			// Upload to S3
			await this.filesService.uploadFiles(files, config.destination);
			await this.logAttachmentAction(options.source, 'add_attachment', config.sourceId, { req: options.req, user_id: options.user_id });
			return res.raw;
		} catch (ex) {
			throw ex;
		}
	}

	async deleteAttachment(source: string, sourceId: number | string[] | number[], attachmentId: number, options: { req, user_id: number }) {
		try {
			const config: any = this.getAttachmentsConfig(source, sourceId);

			const response = await config.qb.createQueryBuilder().delete().where('id=:id', { id: +attachmentId }).returning(['file_name']).execute();

			const fileDestination = `${config.destination}/${response.raw[0].file_name}`
			await this.filesService.deleteFiles([fileDestination]);
			await this.logAttachmentAction(source, 'delete_attachment', config.sourceId, { req: options.req, user_id: options.user_id });
			return {};
		} catch (ex) {
			throw ex;
		}
	}

	async downloadAttachment(source: string, attachmentNames: number | string[] | number[]) {
		try {
			const config: any = this.getAttachmentsConfig(source, []);

			if (!Array.isArray(attachmentNames))
				attachmentNames = [attachmentNames];

			return await this.filesService.downloadFiles(attachmentNames, config.destination);
		} catch (ex) {
			throw ex;
		}
	}

	validate(data: { file: any, note: string }) {
		const validation = [];
		const file = data.file;
		const note = data?.note;

		if (note?.length > this.maxNoteCharacters)
			validation.push('note_length');

		const fileExtension = (file.originalname.split('.').pop()).toLowerCase();

		if (!this.allowedUploadFilesExt.includes(fileExtension))
			validation.push('file_extension');

		if (file.size > this.maxFileSize)
			validation.push('file_size');

		return validation;
	}

	getAttachmentsConfig(source: string, sourceId: number | string | string[] | number[]) {
		let config: any = {};

		switch (source) {
			case 'order':
				config = {
					destination: this.filesService.UPLOAD_DESTINATION.ORDER_ATTACHMENT + '/' + sourceId,
					qb: this.orderAttachmentsRepository,
					sourceIdColumn: 'order_id',
					sourceId,
					tableName: 'order_attachments',
				};
				break;
			default:
				break;
		}

		return config;
	}

	async checkAttachmentsExists(source, sourceId, files) {
		const config = this.getAttachmentsConfig(source, sourceId);
		const fileNames = files.map(file => file.filename || file.originalname);

		const count = await config.qb
			.createQueryBuilder()
			.where(`file_name IN (:...fileNames)`, { fileNames })
			.andWhere(`${config.sourceIdColumn} = :sourceId`, { sourceId: config.sourceId })
			.getCount();

		return count;
	}

	async logAttachmentAction(source: string, action: string, sourceId: number, options: { new?: any, old?: any, req: any, user_id: number }) {
		try {
			await this.eventEmitter.emitAsync('action.log', {
				old_values: options.old ? { old: options.old } : {},
				new_values: options.new ? { new: options.new } : {},
				action_name: `${source}_${action}`,
				related_id: sourceId,
				action_user_id: options.user_id,
				req: options.req,
				forceLog: true,
			});
		} catch (ex) {
			throw ex;
		}
	}
}
