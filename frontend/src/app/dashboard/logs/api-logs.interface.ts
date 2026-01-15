export interface ApiLog {
	user_id: number;
	end_point: string;
	body_request: string;
	query_request: string;
	created_at: Date;
}
