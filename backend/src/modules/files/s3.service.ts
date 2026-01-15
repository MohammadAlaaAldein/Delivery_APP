import { Injectable } from '@nestjs/common';
import { s3Service } from 'sct-framework/s3/lib/index'

@Injectable()
export class S3Service {

	s3APIsObj: any = null;
	constructor() {
		if (this.s3APIsObj === null)
			this.s3APIsObj = new s3Service();

		this.s3APIsObj.init(process.env.S3_ACCESS_KEY_ID, process.env.S3_SECRET_ACCESS_KEY, process.env.S3_REGION, process.env.S3_BUCKET);
	}

	async uploadFile(filePath: string, fileDest: string) {
		try {
			return await this.s3APIsObj.uploadFile(filePath, fileDest);
		} catch (ex) {
			throw ex;
		}
	}

	async getFile(filePath: string) {
		try {
			return await this.s3APIsObj.getFile(filePath);
		} catch (ex) {
			throw ex;
		}
	}

	async checkFileExists(filePath: string) {
		try {
			return await this.s3APIsObj.checkFileExists(filePath);
		} catch (ex) {
			throw ex;
		}
	}

	async getListOfFiles(folderName: string) {
		try {
			return await this.s3APIsObj.getListOfFiles(folderName);
		} catch (ex) {
			throw ex;
		}
	}

	async deleteFiles(files: string[]) {
		try {
			return await this.s3APIsObj.deleteFiles(files);
		} catch (ex) {
			throw ex;
		}
	}
}