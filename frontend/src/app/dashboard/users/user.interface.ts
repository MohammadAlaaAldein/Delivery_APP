export interface User {
	id?: any;
	name?: string;
	email?: string;
	role?: string;
	entity_type?: string;
	created_at?: Date;
	password?: string;
	confirm_password?: string;
	access_functions?: string[];
	refreshToken?: string;
	accessToken?: string;
}

export interface AccessFunction {
	[key: string]: 'read' | 'write' | 'none' | 'yes' | 'no' | null;
}

export interface AccessFunctionData {
	[key: string]: {
		desc?: string[],
		hasReadOption?: boolean,
	}
}
