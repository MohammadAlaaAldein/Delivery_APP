import { Shop, Company, Driver } from '../types';
import apiService from './api.service';

class EntitiesService {
    // ==================== SHOPS ====================

    // Get my shop (for shop users)
    async getMyShop(): Promise<Shop> {
        return apiService.get<Shop>('/shops/my');
    }

    // Update my shop (for shop users)
    async updateMyShop(data: Partial<Shop>): Promise<Shop> {
        return apiService.patch<Shop>('/shops/my', data);
    }

    // Get shop by ID (admin)
    async getShop(shopId: number): Promise<Shop> {
        return apiService.get<Shop>(`/shops/${shopId}`);
    }

    // Get all shops (admin)
    async getAllShops(): Promise<Shop[]> {
        return apiService.get<Shop[]>('/shops');
    }

    // ==================== COMPANIES ====================

    // Get my company (for company users)
    async getMyCompany(): Promise<Company> {
        return apiService.get<Company>('/companies/my');
    }

    // Update my company (for company users)
    async updateMyCompany(data: Partial<Company>): Promise<Company> {
        return apiService.patch<Company>('/companies/my', data);
    }

    // Get my company's drivers
    async getMyCompanyDrivers(): Promise<Driver[]> {
        return apiService.get<Driver[]>('/companies/my/drivers');
    }

    // Get company by ID (admin)
    async getCompany(companyId: number): Promise<Company> {
        return apiService.get<Company>(`/companies/${companyId}`);
    }

    // Get all companies (admin)
    async getAllCompanies(): Promise<Company[]> {
        return apiService.get<Company[]>('/companies');
    }

    // Get companies (alias for getAllCompanies)
    async getCompanies(): Promise<Company[]> {
        return this.getAllCompanies();
    }

    // ==================== DRIVERS ====================

    // Get my driver profile (for driver users)
    async getMyDriverProfile(): Promise<Driver> {
        return apiService.get<Driver>('/drivers/my');
    }

    // Update my driver profile (for driver users)
    async updateMyDriverProfile(data: Partial<Driver>): Promise<Driver> {
        return apiService.patch<Driver>('/drivers/my', data);
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
        return apiService.get<Driver>(`/drivers/${driverId}`);
    }

    // Get all drivers (admin)
    async getAllDrivers(): Promise<Driver[]> {
        return apiService.get<Driver[]>('/drivers');
    }

    // Get active drivers for company
    async getActiveDrivers(): Promise<Driver[]> {
        const drivers = await this.getMyCompanyDrivers();
        return drivers.filter((driver) => driver.is_active);
    }

    // ==================== DROPDOWNS ====================

    // Get active shops for dropdown
    async getActiveShops(): Promise<{ id: number; name: string }[]> {
        const shops = await this.getAllShops();
        return shops
            .filter((shop) => shop.is_active)
            .map((shop) => ({ id: shop.id, name: shop.name }));
    }

    // Get active companies for dropdown
    async getActiveCompanies(): Promise<{ id: number; name: string }[]> {
        const companies = await this.getAllCompanies();
        return companies
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
