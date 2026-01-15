import * as fs from 'fs';
import * as fastifyMultipart from '@fastify/multipart';
import { forwardRef, Provider } from '@nestjs/common';
var crypto = require("crypto");
var CIPHER = 'aes-256-cbc';

export type FunctionLike = (...args: any[]) => any;

export type MethodsOf<T> = {
	[K in keyof T]: T[K] extends FunctionLike ? K : never;
}[keyof T];

export interface API_STATUS_CONFIG {
	[key: string]: {
		[key: string]: {
			err: string;
			api_status: number;
		};
	};
}

export type commonObject = { [key: string]: unknown };

export type serviceReturn<T = any> = { err?: string | number; res?: T };

export const getCacheKey = <T, R>(key: string, suffix?: T): R => {
	if (!suffix) return key as R;

	if (!Array.isArray(suffix)) suffix = [suffix] as T;

	return (suffix as T[]).map((s) => `${key}_${s}`) as R;
};

export const getServerPrettyName = () => {
	return process.env.SERVER_PRETTY_NAME || '';
};

// export const successMsg = () => tran('global_success_msg');

export function forwardRefProviders(providers: any[]): Provider[] {
	return providers.map((provider) => ({
		provide: provider,
		useFactory: (...args: any[]) => new provider(...args),
		inject:
			Reflect.getMetadata('design:paramtypes', provider)?.map((dep: any) =>
				forwardRef(() => dep),
			) || [],
	}));
}

export const CONTACT_US_HOURS_CYCLE = 24;
export const CONTACT_US_LIMIT_PER_DAY = 3;

export class testing {
	static isTest = false;
}

export const getFileName = (filename: string) => {
	const fileVersion = filename.split('.')[1].split('4M')[0];
	const fileVersionEdited = fileVersion.padEnd(4, '0');
	return filename.replace(fileVersion, fileVersionEdited.padEnd(4, '0'));
};

// export const getDestination = async (file) => {
// 	const tmpDir = join(FILE_PATH, 'tmp');
// 	if (!fs.existsSync(tmpDir)) {
// 		fs.mkdirSync(tmpDir, { recursive: true });
// 	}
// 	const pump = promisify(pipeline);
// 	await pump(file.file, fs.createWriteStream(join(tmpDir, getFileName(file.filename))));
// 	return tmpDir;
// };

export const handleFiles = async (parts: AsyncIterableIterator<fastifyMultipart.Multipart>) => {
	try {
		const files: any = [];
		const fields: any = {};
		for await (const part of parts) {
			if (part.type === 'file') {
				const buffers = [];
				for await (const chunk of part.file) {
					buffers.push(chunk);
				}
				const fileBuffer = Buffer.concat(buffers);

				files.push({
					filename: part.filename,
					mimetype: part.mimetype,
					buffer: fileBuffer,
					encoding: part.encoding,
					type: part.type,
					file: part.file,
					fieldname: part.fieldname,
					originalname: part.filename,
				});
			} else if (part.type === 'field') {
				fields[part.fieldname] = {
					fieldname: part.fieldname,
					value: part.value,
					type: part.type,
					encoding: part.encoding,
					mimetype: part.mimetype,
				};
			}
		}
		return { files, fields };
	} catch (ex) {
		throw ex;
	}
};

export const encrypt = (text, SALT) => {
	var iv = Buffer.from(String(text).slice(0, 16).padEnd(16, 'SCT'));
	var cipher = crypto.createCipheriv(CIPHER, SALT, iv);
	var encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return [iv.toString('hex'), encrypted.toString('hex')].join(':');
};

export const decrypt = (text, SALT) => {
	if (!text)
		return text;
	var textSplitted = text.split(':');
	var iv = Buffer.from(textSplitted.shift(), 'hex');
	var encrypted = Buffer.from(textSplitted.join(':'), 'hex');
	var decipher = crypto.createDecipheriv(CIPHER, SALT, iv);
	var decrypted = decipher.update(encrypted);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
};