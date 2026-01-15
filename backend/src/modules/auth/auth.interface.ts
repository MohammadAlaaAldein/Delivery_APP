import { ENTITY_TYPE, USER_ROLE } from "../user-roles/user-roles.service";

export interface UserResponse {
	name: string;
	email: string;
	role: USER_ROLE;
	// entity_type: ENTITY_TYPE;
	entity_id: number;
	accessToken: string;
	refreshToken: string;
}
