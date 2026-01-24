import { VehicleType } from "./drivers.service";

export interface Driver {
    id: number;
    user_id: number;
    is_active: boolean;
    company_id?: number;
    name?: string;
    national_id?: string;
    birth_date?: string;
    phone?: string;
    city?: string;
    personal_image?: string;
    license_number?: string;
    license_expiry_date?: string;
    license_image?: string;
    vehicle_type?: VehicleType;
    vehicle_brand?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_color?: string;
    plate_number?: string;
    vehicle_image?: string;
    created_at?: string;
    updated_at?: string;
}
