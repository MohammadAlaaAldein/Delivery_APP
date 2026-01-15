import * as bcrypt from 'bcrypt';
import moment from 'moment';
import * as en from '../../../shared/translation/en.json';
import _ from 'lodash';
import { createHash, randomInt } from 'crypto';
import { User } from 'src/modules/users/entities/user.entity';
import { exec } from 'child_process';
import { promisify } from 'util';
import { URL_PREFIX } from 'src/common/constants';

const execAsync = promisify(exec);

export function nowTime() {
	return moment().utc().unix();
}

export function nowTimeInDateFormat() {
	return new Date(nowTime() * 1000);
}

export function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

export async function hashPassword(password: string): Promise<string> {
	try {
		const salt = await bcrypt.genSalt(10);
		return await bcrypt.hash(password, salt);
	} catch (ex) {
		throw ex;
	}
}

export async function comparePasswords(password1: string, password2: string): Promise<boolean> {
	try {
		return await bcrypt.compare(password1, password2)
	} catch (ex) {
		throw ex;
	}
}

export function translate(textToTranslate: string, replace = {}): string {
	const keys = textToTranslate.split('.');
	let message: any = en;

	// Traverse nested keys
	for (const key of keys) {
		if (message && key in message) {
			message = message[key];
		} else {
			console.error('Message is not translated:', textToTranslate);
			return textToTranslate;
		}
	}

	// Replace placeholders if any
	if (typeof message === 'string' && Object.keys(replace).length > 0) {
		return message.replace(/{{([^}]*)}}/g, (match, p1) => {
			const variableName = p1.trim();
			return replace[variableName] ?? match;
		});
	}

	return typeof message === 'string' ? message : textToTranslate;
}

export function arrayToAssociativeArray(array, key = 'id', multipleValues = false) {
	const finalResult = {};
	for (const item in array) {
		if (!multipleValues)
			finalResult[array[item][key]] = array[item];
		else {
			if (!finalResult[array[item][key]])
				finalResult[array[item][key]] = [];
			finalResult[array[item][key]].push(array[item]);
		}
	}
	return finalResult;
}

export function getSystemNoteUserInfo() {
	const systemUser = new User();

	systemUser.id = 2147483647;
	systemUser.name = 'System';
	return systemUser;
}

export function generateSessionId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}

export function objectsCompareOneLevel(
	param1: { [key: string]: any },
	param2: { [key: string]: any },
	onlyCheck = false,
) {
	//get the difference between two objects.
	/*If one level = true then if sub-key in the object is also an object and at least one internal value != what in param1 then the entire sub-key will added to diffObj:
	ex: obj1 = {A: 1, B: {c: 2, d: 3}}, obj2 = {A: 1, B: {c: 2, d: 4}} => diffObj = {B: {c: 2, d: 3}}*/

	const obj1 = structuredClone(param1);
	const obj2 = structuredClone(param2);

	const diffObj = {};
	let isChanged = false;

	for (const key in obj2) {
		if (obj2[key] && typeof obj2[key] == 'object') {
			if (Array.isArray(obj2[key])) {
				//in case of array
				if (!arrayCompare(obj2[key], obj1[key])) {
					if (onlyCheck) {
						isChanged = true;
						break;
					}
					diffObj[key] = obj2[key];
				}
			} else {
				const isChangedTemp = objectsCompareOneLevel(obj1[key], obj2[key], true);

				if (isChangedTemp) {
					if (onlyCheck) {
						isChanged = true;
						break;
					}

					diffObj[key] = obj2[key];
				}
			}
		} else if (obj2[key] != obj1[key]) {
			if (onlyCheck) {
				isChanged = true;
				break;
			}

			diffObj[key] = obj2[key];
		}
	}

	if (onlyCheck) return isChanged;

	return diffObj;
};

export function arrayCompare(arr1: any[], arr2: any[]) {
	return arr1 && arr2 && arr1.length == arr2.length && arr1.every((u, i) => u === arr2[i]);
};

export function md5(text: string): string {
	return createHash('md5').update(text).digest('hex');
}

export async function convertDataToCSVFile(columns, data, options) {
	return new Promise((resolve, reject) => {
		if (!options.sendEmptyFile && (!Array.isArray(data) || data.length === 0))
			return resolve(data);

		const dataObj = options ? options : { returnData: true };

		dataToCSVFile(columns, data, dataObj, (err, fileData) => {
			if (err)
				reject(err);
			else
				resolve(fileData);
		});
	});
}

function dataToCSVFile(headerColumns, data, options, callback) {
	try {
		var columnSeperator = options.columnSeperator || '|',
			rowsSeperator = options.rowsSeperator || '\n',
			// eslint-disable-next-line no-useless-escape
			fieldQualifier = options.fieldQualifier || '\"';

		var fileData = "sep=" + columnSeperator + rowsSeperator + fieldQualifier + headerColumns.join(fieldQualifier + columnSeperator + fieldQualifier) + fieldQualifier + rowsSeperator;
		for (var row of data) {
			fileData += fieldQualifier + row.join(fieldQualifier + columnSeperator + fieldQualifier) + fieldQualifier + rowsSeperator;
		}
		var returnData = options.returnData || false;
		if (returnData)
			return callback(null, fileData);

		var fileName = options.fileName || 'Unnammed File.csv';

		var fs = require('fs');
		fs.writeFile(fileName, fileData, 'utf8', function (err) {
			if (err) {
				return callback(err);
			}
			return callback();
		});
	} catch (e) {
		return callback(e);
	}
}

export function isObject(value: unknown) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function objectsDiff(param1: any, param2: any, reverse: boolean = false) {
	//default: obj2 - obj1 unless reverse = true then obj1 - obj2
	const obj1 = structuredClone(param1);
	const obj2 = structuredClone(param2);

	let diffObj = {};
	if (reverse) {
		for (let key in obj1) {

			if (obj1[key] && typeof (obj1[key]) == 'object') {

				if (Array.isArray(obj1[key])) {

					//in case of array
					if (!arrayCompare(obj1[key], obj2[key]))
						diffObj[key] = obj1[key];
				} else {

					diffObj[key] = objectsDiff(obj1[key], obj2[key]);
					if (Object.keys(diffObj[key]).length == 0)
						delete diffObj[key];
				}
			} else if (obj1[key] != obj2[key]) {
				diffObj[key] = obj1[key];
			}
		}
	} else {
		for (let key in obj2) {

			if (obj2[key] && typeof (obj2[key]) == 'object') {

				if (Array.isArray(obj2[key])) {

					//in case of array
					if (!arrayCompare(obj2[key], obj1[key]))
						diffObj[key] = obj2[key];
				} else {

					diffObj[key] = objectsDiff(obj2[key], obj1[key], true);
					if (Object.keys(diffObj[key]).length == 0)
						delete diffObj[key];
				}
			} else if (obj2[key] != obj1[key]) {
				diffObj[key] = obj2[key];
			}
		}
	}

	return diffObj;
};

export async function getGitBranchInfo(): Promise<void> {
	try {
		const { stdout } = await execAsync([
			'git describe --always --tags --dirty',
			'git rev-parse --abbrev-ref HEAD',
			'git log -1 --format=%cd --date=iso',
			'git log -1 --format=%s',
			'git log -1 --format=%H',
			'git log -1 --format=%cn',
		].join(' && '));

		const result = stdout.trim().split('\n');
		process.env.gitBranchInfo = JSON.stringify({
			commitID: result[0],
			branchName: result[1],
			date: result[2],
			subject: result[3],
			hash: result[4],
			committerName: result[5],
		});
	} catch (error) {
		process.env.gitBranchInfo = JSON.stringify({
			commitID: 'N/A',
			branchName: 'N/A'
		});
		console.error('Failed to get git info:', error);
	}
}

export function getControllersPrefixes(controllerName = '') {
	const supportedVersions = ['v1', 'v2'];
	const prefixes: string[] = [];

	if (controllerName) {
		prefixes.push(controllerName, `${URL_PREFIX}/${controllerName}`);
	} else {
		prefixes.push('', `${URL_PREFIX}`);
	}

	for (const version of supportedVersions) {
		if (controllerName) {
			prefixes.push(`${URL_PREFIX}/${version}/${controllerName}`);
		} else {
			prefixes.push(`${URL_PREFIX}/${version}`);
		}
	}

	return prefixes;
}

export function generateOtpCode() {
	const n = randomInt(0, 1_000_000); // 0 .. 999999
	return n.toString().padStart(6, '0');
}

export function asciiValue(str: string) {
	let sum = 0;
	const normalized = str.toLowerCase();
	for (let i = 0; i < normalized.length; i++) {
		sum += normalized.charCodeAt(i);
	}
	return sum;
}

export function isFwVersionLess(version: string, target: string) {
	const v = version.split('.').map(Number);
	const t = target.split('.').map(Number);

	for (let i = 0; i < Math.max(v.length, t.length); i++) {
		const numV = v[i] || 0;
		const numT = t[i] || 0;

		if (numV < numT) return true;
		if (numV > numT) return false;
	}
	return false;
}

export function celsiusToFahrenheit(celsius: number = 0): number {
	return Math.round((1.8 * celsius) + 32);
}