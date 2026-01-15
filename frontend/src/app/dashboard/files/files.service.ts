import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';

@Injectable({
	providedIn: 'root'
})
export class FilesService {
	private readonly ROUTE = 'files';

	constructor(private http: HttpClient) {}

	download(usage: string, name?: string) {
		return this.http
			.get(`/${this.ROUTE}/getFile`, {
				params: { usage, name, options: JSON.stringify({ returnInResponse: true }) }
			})
			.toPromise()
			.then((res: any) => {
				if (!res) return;
				const arr = new Uint8Array(res.file.data);
				const blob = new Blob([arr]);
				if (blob) {
					const fileName = name || `${usage}.${this.detectFileExtension(res.ContentType)}`;
					if (!fileName) return console.error('download error = No File Name');

					saveAs(blob, fileName);
				}
			})
			.catch((err) => console.error('download error = ', err));
	}

	detectFileExtension(contentType: string) {
		let extension = '';

		switch (true) {
			case contentType.includes('sheet'):
				extension = 'xlsx';
				break;
			case contentType.includes('jpg'):
				extension = 'jpg';
				break;
			case contentType.includes('jpeg'):
				extension = 'jpeg';
				break;
			case contentType.includes('png'):
				extension = 'png';
				break;
			default:
				break;
		}

		return extension;
	}
}
