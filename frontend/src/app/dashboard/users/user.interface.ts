import { USER_ROLE } from "./users.service";

export interface User {
	id?: any;
	name?: string;
	email?: string;
	role?: USER_ROLE;
	entity_id?: number;
	entity_name?: string;
	// entity_type?: string;
	is_active?: boolean;
	created_at?: Date;
	password?: string;
	confirm_password?: string;
	refreshToken?: string;
	accessToken?: string;
}