import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Injectable({
	providedIn: 'root'
})
export class ExcelService {
	EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
	EXCEL_EXTENSION = '.xlsx';

	public exportAsExcelFile(json: any[], excelFileName: string, header?: any): void {
		let headObj = Object.values(header);
		const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json, { header: Object.keys(json[0]) });
		XLSX.utils.sheet_add_aoa(worksheet, [headObj], { origin: 'A1' });

		const workbook: XLSX.WorkBook = {
			Sheets: { [excelFileName || 'Sheet1']: worksheet },
			SheetNames: [excelFileName || 'Sheet1']
		};
		const excelBuffer: any = XLSX.write(workbook, {
			bookType: 'xlsx',
			type: 'array'
		});
		this.saveAsExcelFile(excelBuffer, excelFileName);
	}

	private saveAsExcelFile(buffer: any, fileName: string): void {
		const data: Blob = new Blob([buffer], {
			type: this.EXCEL_TYPE
		});
		saveAs(data, fileName + this.EXCEL_EXTENSION);
	}

	async readExcelData(event: any) {
		const target: DataTransfer = <DataTransfer>event.target;

		try {
			// Wait for the file to be read as a binary string
			const binaryStr = await this.readFileAsBinaryString(target.files[0]);

			// Parse the Excel file using xlsx
			const workbook: XLSX.WorkBook = XLSX.read(binaryStr, { type: 'binary' });

			// Extract data from the first sheet
			const worksheetName: string = workbook.SheetNames[0];
			const worksheet: XLSX.WorkSheet = workbook.Sheets[worksheetName];

			// Convert the sheet data to JSON
			const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
			return data;
		} catch (error) {
			console.error('Error reading file:', error);
		}
	}

	// Helper method to read the file as binary string using async/await
	private readFileAsBinaryString(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = (e: any) => resolve(e.target.result);
			reader.onerror = reject;

			reader.readAsBinaryString(file);
		});
	}
}
