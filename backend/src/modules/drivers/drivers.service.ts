import { Injectable } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { FastifyRequest } from 'fastify';
import { ErrorKeys } from 'src/common/api-response';
import { ListDriversDto } from './dto/list-drivers.dto';

@Injectable()
export class DriversService {

    constructor(
        @InjectRepository(Driver)
        private readonly driversRepository: Repository<Driver>,
        private connection: DataSource,
    ) { }

    private getDriverRepository(entityManager?: EntityManager): Repository<Driver> {
        return entityManager ? entityManager.getRepository(Driver) : this.connection.getRepository(Driver);
    }

    async createForUser(userId: number, companyId: number | null): Promise<Driver> {
        try {
            // Check if driver already exists for this user
            const existingDriver = await this.driversRepository.findOne({ where: { user_id: userId } });
            if (existingDriver) {
                // Update company_id if different
                if (existingDriver.company_id !== companyId) {
                    await this.driversRepository.update({ user_id: userId }, { company_id: companyId });
                    existingDriver.company_id = companyId;
                }
                return existingDriver;
            }

            // Create new driver
            const driver = this.driversRepository.create({
                user_id: userId,
                company_id: companyId,
            });
            await this.driversRepository.save(driver);
            return driver;
        } catch (ex) {
            throw ex;
        }
    }

    async updateCompanyForUser(userId: number, companyId: number | null): Promise<void> {
        try {
            await this.driversRepository.update({ user_id: userId }, { company_id: companyId });
        } catch (ex) {
            throw ex;
        }
    }

    async removeCompanyFromDriver(userId: number): Promise<void> {
        try {
            await this.driversRepository.update({ user_id: userId }, { company_id: null });
        } catch (ex) {
            throw ex;
        }
    }

    async findByUserId(userId: number): Promise<Driver | null> {
        return this.driversRepository.findOne({ where: { user_id: userId }, relations: ['user'] });
    }

    async create(createDriverDto: CreateDriverDto, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const driver = this.driversRepository.create(createDriverDto);

            const uniqueFieldFound = await this.checkDriverUniqueFields(createDriverDto);
            if (uniqueFieldFound)
                return this.checkDriverUniqueFieldsError(uniqueFieldFound);

            await this.driversRepository.save(driver);
            return driver;
        } catch (ex) {
            throw ex;
        }
    }

    async update(userId: number, fields: UpdateDriverDto, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const allowedFields = [
                'is_active',
                'national_id',
                'birth_date',
                'phone',
                'city',
                'personal_image',
                'license_number',
                'license_expiry_date',
                'license_image',
                'vehicle_type',
                'vehicle_brand',
                'vehicle_model',
                'vehicle_year',
                'vehicle_color',
                'plate_number',
                'vehicle_image',
            ];

            const driver = (await this.getDrivers({ user_id: userId }))[0];

            // Check uniqueness
            const uniqueFieldFound = await this.checkDriverUniqueFields(fields, driver);
            if (uniqueFieldFound)
                return this.checkDriverUniqueFieldsError(uniqueFieldFound);

            const updateFields: Partial<UpdateDriverDto> = {};

            for (const field in fields) {
                if (allowedFields.includes(field))
                    updateFields[field] = fields[field];
            }

            if (Object.keys(updateFields).length) {
                await this.driversRepository.createQueryBuilder().update().set(updateFields).where('user_id = :user_id', { user_id: userId }).execute();
            }

            return { err: null, res: updateFields };
        } catch (ex) {
            throw ex;
        }
    }

    async toggleActive(userId: number, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const driver = (await this.getDrivers({ user_id: userId }))[0];
            if (!driver)
                return { err: ErrorKeys.NOT_FOUND };

            const newStatus = !driver.is_active;
            await this.driversRepository.createQueryBuilder().update().set({ is_active: newStatus }).where('user_id = :user_id', { user_id: userId }).execute();

            return { err: null, res: { is_active: newStatus } };
        } catch (ex) {
            throw ex;
        }
    }

    private checkDriverUniqueFieldsError(field: string) {
        let errorKey = '';
        switch (field) {
            case 'national_id':
                errorKey = ErrorKeys.UNIQUE_VIOLATION_NATIONAL_ID;
                break;
            case 'license_number':
                errorKey = ErrorKeys.UNIQUE_VIOLATION_LICENSE_NUMBER;
                break;
            case 'plate_number':
                errorKey = ErrorKeys.UNIQUE_VIOLATION_PLATE_NUMBER;
                break;
            default:
                break;
        }
        return { err: errorKey };
    }

    private async checkDriverUniqueFields(fields: UpdateDriverDto, oldDriverInfo?: Partial<Driver>): Promise<any> {
        try {
            // Check national_id uniqueness
            if (fields.national_id && fields.national_id !== oldDriverInfo?.national_id) {
                const existingDriver = await this.driversRepository.findOne({ where: { national_id: fields.national_id } });
                if (existingDriver)
                    return 'national_id';
            }

            // Check license_number uniqueness
            if (fields.license_number && fields.license_number !== oldDriverInfo?.license_number) {
                const existingDriver = await this.driversRepository.findOne({ where: { license_number: fields.license_number } });
                if (existingDriver)
                    return 'license_number';
            }

            // Check plate_number uniqueness
            if (fields.plate_number && fields.plate_number !== oldDriverInfo?.plate_number) {
                const existingDriver = await this.driversRepository.findOne({ where: { plate_number: fields.plate_number } });
                if (existingDriver)
                    return 'plate_number';
            }

            return null;
        } catch (ex) {
            throw ex;
        }
    }

    async getDrivers(filter?: ListDriversDto): Promise<any[]> {
        const queryBuilder = this.driversRepository.createQueryBuilder('driver')
            .leftJoinAndSelect('driver.user', 'user');

        if (filter?.user_id)
            queryBuilder.andWhere('driver.user_id = :user_id', { user_id: filter.user_id });

        if (filter?.company_id)
            queryBuilder.andWhere('driver.company_id = :company_id', { company_id: filter.company_id });

        if (filter?.name)
            queryBuilder.andWhere('user.name ILIKE :name', { name: `%${filter.name}%` });

        if (filter?.phone)
            queryBuilder.andWhere('driver.phone ILIKE :phone', { phone: `%${filter.phone}%` });

        if (filter?.city)
            queryBuilder.andWhere('driver.city ILIKE :city', { city: `%${filter.city}%` });

        if (filter?.license_number)
            queryBuilder.andWhere('driver.license_number ILIKE :license_number', { license_number: `%${filter.license_number}%` });

        if (filter?.plate_number)
            queryBuilder.andWhere('driver.plate_number ILIKE :plate_number', { plate_number: `%${filter.plate_number}%` });

        if (filter?.is_active !== undefined)
            queryBuilder.andWhere('driver.is_active = :is_active', { is_active: filter.is_active });

        queryBuilder.orderBy('driver.created_at', 'DESC');

        const drivers = await queryBuilder.getMany();

        // Map to include name from user
        return drivers.map(driver => ({
            ...driver,
            name: driver.user?.name || null,
            user: undefined, // Remove user object from response
        }));
    }

    async deleteDriver(userId: number, options?: { req?: FastifyRequest }): Promise<void> {
        await this.driversRepository.softDelete({ user_id: userId });
    }
}
