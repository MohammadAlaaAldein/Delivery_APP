export interface DriverRequest {
    id: number;
    requesting_company_id: number;
    company_name?: string;
    status: 'pending' | 'approved' | 'rejected';
    name: string;
    email?: string;
    national_id?: string;
    birth_date?: string;
    phone?: string;
    city?: string;
    personal_image?: string;
    license_number?: string;
    license_expiry_date?: string;
    license_image?: string;
    vehicle_type?: 'car' | 'motorcycle' | 'truck' | 'van' | 'bicycle';
    vehicle_brand?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_color?: string;
    plate_number?: string;
    vehicle_image?: string;
    admin_notes?: string;
    created_at?: string;
    updated_at?: string;
}
