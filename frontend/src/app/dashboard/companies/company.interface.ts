export interface Company {
	id?: any;
	name?: string;
	is_active?: boolean;
	shop_ids?: number[];
	shop_names?: string[];
	// Location fields
	city?: string;
	address?: string;
	// Contact fields
	phone?: string;
	email?: string;
	website?: string;
	// Company info
	company_type?: string;
	// License fields
	license_number?: string;
	license_expiry_date?: string;
	created_at?: Date;
	updated_at?: Date;
}