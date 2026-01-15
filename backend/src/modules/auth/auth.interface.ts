import { USER_ROLE } from "../users/users.service";

export interface UserResponse {
	name: string;
	email: string;
	role: USER_ROLE;
	// entity_type: ENTITY_TYPE;
	entity_id: number;
	accessToken: string;
	refreshToken: string;
}
