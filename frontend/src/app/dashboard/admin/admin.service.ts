import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
	providedIn: 'root'
})
export class AdminService {
	private readonly ROUTE = 'admin';

	constructor(
		private http: HttpClient,
	) { }

	getActionLogs(options) {
		return this.http.get('/action-log/get-action-logs', {
			params: options,
			observe: "body"
		});
	}

	getDeviceFirmwareUpdateLogs() {
		return this.http.get('/FW/get-device-fw-update-logs', {
			observe: "body"
		});
	}

	getBlockedDeviceFirmwareLogs() {
		return this.http.get('/FW/get-blocked-device-logs', {
			observe: "body"
		});
	}

	unBlockDeviceFirmware(devices: {imei: string, fw_version: string}[]) {
		return this.http.post(`/FW/unblock-device-fw`, devices, {
			observe: "body"
		});
	}
}
