import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { TypeOrmModule } from '@nestjs/typeorm/dist';
import { OrderAttachments } from '../shipment/order/entities/order-attachments.entity';
import { FilesModule } from '../files/files.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			OrderAttachments
		]),
		FilesModule,
	],
	controllers: [AttachmentsController],
	providers: [AttachmentsService]
})
export class AttachmentsModule {}
