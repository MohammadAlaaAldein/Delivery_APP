import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';
import { writeFileSync, existsSync, mkdirSync, unlinkSync, readFileSync, rmSync } from 'fs';
import { nowTime } from 'src/common/utilities';
import archiver from 'archiver';
import * as fs from 'fs';

@Injectable()
export class FilesService {

	public UPLOAD_DESTINATION = {
		REPORTS_FILES: 'shipping-out-reports',
		ORDER_ATTACHMENT: 'order-attachments',
	};

	public TEMP_DIR = "./temp-files"; //Default folder to store the files
	public TEMP_S3_DIR = "./s3-temp"; //Default folder to store S3 files

	constructor(
		private s3: S3Service,
	) { }

	async uploadFiles(files: any, destination: string, options?: any) {
		options = options || {};
		try {
			let tempDir = this.TEMP_S3_DIR;
			if (options.dir)
				tempDir = options.dir;

			if (options.subDir)
				tempDir = `${tempDir}/${options.subDir}`;

			if (!existsSync(tempDir))
				mkdirSync(tempDir, { recursive: true });

			let fileEncoding = { flag: 'w' };
			if (options.encoding)
				fileEncoding = options.encoding;

			for (const file of files) {
				const tempDest = tempDir + '/' + file.originalname;
				writeFileSync(tempDest, file.buffer, fileEncoding);
				await this.s3.uploadFile(tempDest, destination);
				
				if (!options.ignoreDeleteTempFiles)
					unlinkSync(tempDest);
			}
			return true;
		} catch (ex) {
			throw ex;
		}
	}

	async downloadFiles(files: any, source: string, options?: any) {
		try {
			options = options || {};

			//Check if the returning content should be as zip file or single file
			const compress: boolean = (files.length > 1) ? true : false;
			let tempDir = this.TEMP_S3_DIR; //Default folder to store the files

			if (!existsSync(tempDir))
				mkdirSync(tempDir);

			if (compress) {
				const currentTime = nowTime();
				tempDir = `${tempDir}/${files[0].source || source}_${currentTime}`;
				if (!existsSync(tempDir))
					mkdirSync(tempDir, { recursive: true });
			}

			//Get files content from S3
			for (const file of files) {
				const fileSource = file.source || source;
				const fileName = file.file || file;
				const fileData = await this.s3.getFile(`${fileSource}/${fileName}`);
				writeFileSync(`${tempDir}/${fileName}`, fileData.Body, { flag: 'w' });
			}

			let returnPath = `${tempDir}/${files[0].file || files[0]}`;
			if (compress) {
				returnPath = `${tempDir}.zip`;
				if (options.zipFileName)
					returnPath = `${options.zipFileName}.zip`;
				await this.zipDirectory(tempDir, returnPath);
			}

			const content = readFileSync(returnPath);

			//Delete files
			unlinkSync(returnPath);
			if (compress)
				rmSync(tempDir, { recursive: true, force: true });

			return { name: returnPath.split('/').pop(), content: content };
		} catch (ex) {
			throw ex;
		}
	}

	async deleteFiles(files: string[]) {
		try {
			return await this.s3.deleteFiles(files);
		} catch (ex) {
			throw ex;
		}
	}

	async zipDirectory(source: string, dest: fs.PathLike) {
		const archive = archiver('zip', { zlib: { level: 9 } });
		const stream = fs.createWriteStream(dest);

		return new Promise((resolve, reject) => {
			archive
				.directory(source, false)
				.on('error', err => reject(err))
				.pipe(stream);

			stream.on('close', () => resolve('archived'));
			archive.finalize();
		});
	}

	async uploadFileToTempDir(fileName: string, data: any, options?: any) {
		options = options || {};
		try {
			let tempDir = this.TEMP_DIR;
			if (options.subDir)
				tempDir = `${tempDir}/${options.subDir}`;

			if (!existsSync(tempDir))
				mkdirSync(tempDir, { recursive: true });

			const filePath = `${tempDir}/${fileName}` || 'Unnamed File.csv';

			let fileEncoding = { flag: 'w' };
			if (options.encoding)
				fileEncoding = options.encoding;

			writeFileSync(filePath, data, fileEncoding);
			return filePath;
		} catch (ex) {
			throw ex;
		}
	}

	async downloadFilesFromTempDir(files: any, options?: any) {
		options = options || {};
		try {
			//Check if the returning content should be as zip file or single file
			const compress: boolean = (files.length > 1) ? true : false;

			let tempDir = this.TEMP_DIR; //Default folder to store the files
			if (!existsSync(tempDir))
				mkdirSync(tempDir);

			if (compress) {
				tempDir = `${tempDir}/${options.subDir}`;
				if (!existsSync(tempDir))
					mkdirSync(tempDir, { recursive: true });
			}

			let returnPath = `${tempDir}/${files[0]}`;
			if (compress) {
				returnPath = `${tempDir}.zip`;
				if (options.zipFileName)
					returnPath = `${options.zipFileName}.zip`;

				await this.zipDirectory(tempDir, returnPath);
			}

			const content = readFileSync(returnPath);

			//Delete files
			unlinkSync(returnPath);

			if (compress)
				rmSync(tempDir, { recursive: true, force: true });

			return { name: returnPath.split('/').pop(), content: content };
		} catch (ex) {
			throw ex;
		}
	}
}