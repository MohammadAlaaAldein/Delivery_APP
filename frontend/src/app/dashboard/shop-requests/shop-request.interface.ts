export interface ShopRequest {
    id: number;
    requesting_company_id: number;
    company_name?: string;
    status: 'pending' | 'approved' | 'rejected';
    name: string;
    city?: string;
    area?: string;
    street?: string;
    building?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    license_number?: string;
    license_type?: string;
    license_expiry_date?: string;
    admin_notes?: string;
    created_at?: string;
    updated_at?: string;
}
