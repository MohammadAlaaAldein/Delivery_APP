import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { S3Service } from './s3.service';

@Module({
	providers: [FilesService, S3Service],
	exports: [FilesService],
})
export class FilesModule {}
