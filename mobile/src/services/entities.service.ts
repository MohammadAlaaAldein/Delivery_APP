import { Shop, Company, Driver } from '../types';
import apiService from './api.service';

class EntitiesService {
    // ==================== SHOPS ====================

    // Get my shop (for shop users)
    async getMyShop(): Promise<Shop> {
        const res = await apiService.get<any>('/shops/my');
        return res.data || res;
    }

    // Update my shop (for shop users)
    async updateMyShop(data: Partial<Shop>): Promise<Shop> {
        const res = await apiService.patch<any>('/shops/my', data);
        return res.data || res;
    }

    // Get shop by ID (admin)
    async getShop(shopId: number): Promise<Shop> {
        const res = await apiService.get<any>(`/shops/${shopId}`);
        return res.data || res;
    }

    // Get all shops (admin)
    async getAllShops(): Promise<Shop[]> {
        const res = await apiService.get<any>('/shops');
        return res.data || res;
    }

    // ==================== COMPANIES ====================

    // Get my company (for company users)
    async getMyCompany(): Promise<Company> {
        const res = await apiService.get<any>('/companies/my');
        return res.data || res;
    }

    // Update my company (for company users)
    async updateMyCompany(data: Partial<Company>): Promise<Company> {
        const res = await apiService.patch<any>('/companies/my', data);
        return res.data || res;
    }

    // Get my company's drivers
    async getMyCompanyDrivers(): Promise<Driver[]> {
        const res = await apiService.get<any>('/companies/my/drivers');
        return res.data || res;
    }

    // Get company by ID (admin)
    async getCompany(companyId: number): Promise<Company> {
        const res = await apiService.get<any>(`/companies/${companyId}`);
        return res.data || res;
    }

    // Get all companies (admin)
    async getAllCompanies(): Promise<Company[]> {
        const res = await apiService.get<any>('/companies');
        return res.data || res;
    }

    // Get companies (alias for getAllCompanies)
    async getCompanies(): Promise<Company[]> {
        return this.getAllCompanies();
    }

    // ==================== DRIVERS ====================

    // Get my driver profile (for driver users)
    async getMyDriverProfile(): Promise<Driver> {
        const res = await apiService.get<any>('/drivers/my');
        return res.data || res;
    }

    // Update my driver profile (for driver users)
    async updateMyDriverProfile(data: Partial<Driver>): Promise<Driver> {
        const res = await apiService.patch<any>('/drivers/my', data);
        return res.data || res;
    }

    // Update driver location
    async updateDriverLocation(latitude: number, longitude: number): Promise<void> {
        await apiService.post('/drivers/my/location', { latitude, longitude });
    }

    // Clear driver location
    async clearDriverLocation(): Promise<void> {
        await apiService.delete('/drivers/my/location');
    }

    // Get driver by ID (admin/company)
    async getDriver(driverId: number): Promise<Driver> {
        const res = await apiService.get<any>(`/drivers/${driverId}`);
        return res.data || res;
    }

    // Get all drivers (admin)
    async getAllDrivers(): Promise<Driver[]> {
        const res = await apiService.get<any>('/drivers');
        return res.data || res;
    }

    // Get active drivers for company
    async getActiveDrivers(): Promise<Driver[]> {
        const drivers = await this.getMyCompanyDrivers();
        return (Array.isArray(drivers) ? drivers : []).filter((driver) => driver.is_active);
    }

    // ==================== DROPDOWNS ====================

    // Get active shops for dropdown
    async getActiveShops(): Promise<{ id: number; name: string }[]> {
        const shops = await this.getAllShops();
        return (Array.isArray(shops) ? shops : [])
            .filter((shop) => shop.is_active)
            .map((shop) => ({ id: shop.id, name: shop.name }));
    }

    // Get active companies for dropdown
    async getActiveCompanies(): Promise<{ id: number; name: string }[]> {
        const companies = await this.getAllCompanies();
        return (Array.isArray(companies) ? companies : [])
            .filter((company) => company.is_active)
            .map((company) => ({ id: company.id, name: company.name }));
    }

    // Get active drivers for dropdown (company)
    async getActiveDriversForDropdown(): Promise<{ id: number; name: string }[]> {
        const drivers = await this.getActiveDrivers();
        return drivers.map((driver) => ({
            id: driver.user_id,
            name: driver.user?.name || driver.name || `Driver ${driver.id}`,
        }));
    }
}

export const entitiesService = new EntitiesService();
export default entitiesService;
