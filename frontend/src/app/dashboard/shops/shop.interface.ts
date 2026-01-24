export interface Shop {
	id?: any;
	name?: string;
	is_active?: boolean;
	company_ids?: number[];
	// Location fields
	city?: string;
	area?: string;
	street?: string;
	building?: string;
	latitude?: number | string;
	longitude?: number | string;
	address?: string;
	// Contact fields
	phone?: string;
	whatsapp?: string;
	email?: string;
	// License fields
	license_number?: string;
	license_type?: string;
	license_expiry_date?: string;
	created_at?: Date;
	updated_at?: Date;
}