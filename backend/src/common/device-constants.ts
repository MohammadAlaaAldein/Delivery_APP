import { DebugRecord } from "src/modules/devices/entities/debug-record.entity";
import { Device } from "src/modules/devices/entities/device.entity";
import { CorruptedEvent } from "src/modules/devices/events/entities/corrupted-event.entity";
import { CellInfo, EventDataType, SystemInfo } from "src/modules/devices/types";
export const deviceLockTtl		= 105; //01:45 minute

export enum DEVICE_SERVER_CACHE_KEYS {
	device_queue = "device_queue_v3",
	device_cmd_queue = "device_cmd_queue_v1",
	device_lock = "device_lock_v1",
	available_wifi_networks = "available_wifi_networks",
	device_last_connect_time = "device_last_connect_time_v2",
	device_detailed_last_connect_time = 'device_detailed_last_connect_time_v2',
	device_rejection = "device_rejection_v1",
	block_FW_device = "block_FW_device",
	ips_blacklist = "ips_blacklist",
	device_cleaned_rejection = "device_cleaned_rejection_v1",
	node_server_last_up_time = "node_server_last_up_time",
	firmware_update_status = "device_firmware_update_status_v1",
	devices_failures = "devices_failures_v3",
	last_device_id_for_devices_failures = "last_device_id_for_devices_failures_v3",
	last_device_id_for_connectivity_status = "last_device_id_for_connectivity_status_v2",
	device_session_info = "device_session_info_v1",
	auto_fw_update = "auto_fw_update",
	read_cellular_info = 'read_cellular_info',
	cmd_cell_test_status = "cmd_cell_test_status_",
	fw_update_cancel = "fw_update_cancel",
};

export interface ProtocolSocket {
	globalObject: GlobalObject;
}

export interface GlobalObject {
	deviceIPaddress: string;
	commState: number;
	prevState: number;
	overrideState: number;
	currCommand: string | number;
	socketConnectionId: number;
	commandResponseBuffer: Buffer;
	initOutBufferSize: number;
	initInBufferSize: number;
	rejectionObject: any;
	errorObj: any;
	savedForAutoFwUpdate: boolean;
	fetchedData: {
		defineRes: any;
	};
	deviceInfo: Device;
	activeQueue: any;
	updateObject: {
		fields: Partial<Device>/*{
			// end_event_id: number;
			// last_debug_id: number;
			// debug_synch_time: number;
			// quick_view: any;
			// debug_end_id: number;
			// firmware_version_to_push: number;
			// ip_address: string;
			// fw_version: string;
			// end_event_id: number;
		};*/
		configs: any;
		system_info: SystemInfo;
		cell_info: CellInfo;
		events: EventDataType[];
		corruptedEvents: CorruptedEvent[];
		debugRecords: DebugRecord[];
		// debugRecords: any;
	};
	controls: {
		forceReadConfig: boolean;
		forceCloseSocket: boolean;
		forceTimeCorrection: boolean;
		noLastConnectTimeUpdate: boolean;
		forceUnlock: boolean;
		emittedCancel: any[];
		processedQueuedCommandsCount: number;
		maxDeviceFetchingCount: number;
	};
	encryption: {
		enc_code: number;
		session_id: any;
		encryption_key: any;
		cacheUsed: boolean;
	};
	pendingTask: {
		eventFetching: number;
		debugFetching: number;
		queuedCommands: number;
		queuedCommandsMore3: number;
		fwUpdate: number;
	};
}