import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { FastifyRequest } from 'fastify';
import { ErrorKeys } from 'src/common/api-response';
import { DriverRequest, DriverRequestStatus } from './entities/driver-request.entity';
import { CreateDriverRequestDto } from './dto/create-driver-request.dto';
import { UpdateDriverRequestDto } from './dto/update-driver-request.dto';
import { ListDriverRequestDto } from './dto/list-driver-request.dto';
import { UsersService, USER_ROLE } from '../users/users.service';
import { DriversService } from '../drivers/drivers.service';

@Injectable()
export class DriverRequestsService {

    constructor(
        @InjectRepository(DriverRequest)
        private readonly driverRequestRepository: Repository<DriverRequest>,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        private readonly driversService: DriversService,
        private connection: DataSource,
    ) { }

    private getRepository(entityManager?: EntityManager): Repository<DriverRequest> {
        return entityManager ? entityManager.getRepository(DriverRequest) : this.connection.getRepository(DriverRequest);
    }

    /**
     * Create a new driver request (Company endpoint)
     */
    async create(companyId: number, createDto: CreateDriverRequestDto, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const driverRequest = this.driverRequestRepository.create({
                ...createDto,
                requesting_company_id: companyId,
                status: DriverRequestStatus.PENDING,
            });

            await this.driverRequestRepository.save(driverRequest);

            return { err: null, res: driverRequest };
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Update a driver request (Admin endpoint)
     */
    async update(id: number, fields: UpdateDriverRequestDto, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const allowedFields = [
                'name',
                'email',
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
                'admin_notes',
            ];

            const driverRequest = (await this.getDriverRequests({ id }))[0];
            if (!driverRequest) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            // Don't allow editing approved requests
            if (driverRequest.status === DriverRequestStatus.APPROVED) {
                return { err: ErrorKeys.INVALID_REQUEST };
            }

            const updateFields: Partial<UpdateDriverRequestDto> = {};

            for (const field in fields) {
                if (allowedFields.includes(field))
                    updateFields[field] = fields[field];
            }

            if (Object.keys(updateFields).length) {
                await this.driverRequestRepository.createQueryBuilder()
                    .update()
                    .set(updateFields)
                    .where('id = :id', { id })
                    .execute();
            }

            return { err: null, res: updateFields };
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Approve a driver request - creates a user with DRIVER role, then creates driver record
     */
    async approve(id: number, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const driverRequest = (await this.getDriverRequests({ id }))[0];
            if (!driverRequest) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            if (driverRequest.status !== DriverRequestStatus.PENDING) {
                return { err: ErrorKeys.INVALID_REQUEST };
            }

            // Generate a temporary password (driver will need to reset it)
            const tempPassword = this.generateTempPassword();

            // Create the user with DRIVER role
            const userData = {
                name: driverRequest.name,
                email: driverRequest.email,
                password: tempPassword,
                role: USER_ROLE.DRIVER,
                is_active: true,
                entity_id: null, // Will be set after driver is created
            };

            const userResult = await this.usersService.create(userData, options);
            if (userResult.err) {
                return userResult;
            }

            const userId = userResult.id;

            // The user creation already creates a driver record, but we need to update it with additional fields
            const driver = await this.driversService.findByUserId(userId);
            if (driver) {
                // Update driver with request data and link to company
                await this.driversService.update(userId, {
                    national_id: driverRequest.national_id,
                    birth_date: driverRequest.birth_date as any,
                    phone: driverRequest.phone,
                    city: driverRequest.city,
                    personal_image: driverRequest.personal_image,
                    license_number: driverRequest.license_number,
                    license_expiry_date: driverRequest.license_expiry_date as any,
                    license_image: driverRequest.license_image,
                    vehicle_type: driverRequest.vehicle_type,
                    vehicle_brand: driverRequest.vehicle_brand,
                    vehicle_model: driverRequest.vehicle_model,
                    vehicle_year: driverRequest.vehicle_year,
                    vehicle_color: driverRequest.vehicle_color,
                    plate_number: driverRequest.plate_number,
                    vehicle_image: driverRequest.vehicle_image,
                }, options);

                // Update company_id for the driver
                await this.driversService.updateCompanyForUser(userId, driverRequest.requesting_company_id);

                // Update user's entity_id to point to the driver
                await this.usersService.update(userId, { entity_id: driver.id }, options);
            }

            // Delete the request after successful approval
            await this.driverRequestRepository.createQueryBuilder()
                .delete()
                .where('id = :id', { id })
                .execute();

            return {
                err: null,
                res: {
                    user_id: userId,
                    temp_password: tempPassword,
                }
            };
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Reject a driver request
     */
    async reject(id: number, adminNotes?: string, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const driverRequest = (await this.getDriverRequests({ id }))[0];
            if (!driverRequest) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            if (driverRequest.status !== DriverRequestStatus.PENDING) {
                return { err: ErrorKeys.INVALID_REQUEST };
            }

            // Update status to rejected
            await this.driverRequestRepository.createQueryBuilder()
                .update()
                .set({
                    status: DriverRequestStatus.REJECTED,
                    admin_notes: adminNotes || driverRequest.admin_notes,
                })
                .where('id = :id', { id })
                .execute();

            return { err: null, res: { request_status: DriverRequestStatus.REJECTED } };
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Delete a driver request
     */
    async delete(id: number, options: { entityManager?: EntityManager, req?: FastifyRequest } = {}): Promise<any> {
        try {
            const repository = this.getRepository(options.entityManager);
            return await repository.createQueryBuilder().softDelete().where({ id }).execute();
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Company updates their own driver request (only if pending or rejected)
     * If rejected, resubmitting will reset status to pending
     */
    async updateMyRequest(id: number, companyId: number, fields: UpdateDriverRequestDto, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const allowedFields = [
                'name',
                'email',
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

            const driverRequest = (await this.getDriverRequests({ id }))[0];
            if (!driverRequest) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            // Verify ownership
            if (driverRequest.requesting_company_id !== companyId) {
                return { err: ErrorKeys.UNAUTHORIZED };
            }

            // Only allow editing pending or rejected requests
            if (driverRequest.status !== DriverRequestStatus.PENDING && driverRequest.status !== DriverRequestStatus.REJECTED) {
                return { err: ErrorKeys.INVALID_REQUEST };
            }

            const updateFields: any = {};

            for (const field in fields) {
                if (allowedFields.includes(field))
                    updateFields[field] = fields[field];
            }

            // If the request was rejected, reset status to pending (resubmit)
            if (driverRequest.status === DriverRequestStatus.REJECTED) {
                updateFields.status = DriverRequestStatus.PENDING;
                updateFields.admin_notes = null; // Clear admin notes on resubmit
            }

            if (Object.keys(updateFields).length) {
                await this.driverRequestRepository.createQueryBuilder()
                    .update()
                    .set(updateFields)
                    .where('id = :id', { id })
                    .execute();
            }

            return { err: null, res: updateFields };
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Company deletes their own driver request (only if pending or rejected)
     */
    async deleteMyRequest(id: number, companyId: number, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const driverRequest = (await this.getDriverRequests({ id }))[0];
            if (!driverRequest) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            // Verify ownership
            if (driverRequest.requesting_company_id !== companyId) {
                return { err: ErrorKeys.UNAUTHORIZED };
            }

            // Only allow deleting pending or rejected requests
            if (driverRequest.status !== DriverRequestStatus.PENDING && driverRequest.status !== DriverRequestStatus.REJECTED) {
                return { err: ErrorKeys.INVALID_REQUEST };
            }

            await this.driverRequestRepository.createQueryBuilder()
                .softDelete()
                .where({ id })
                .execute();

            return { err: null, res: { deleted: true } };
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Get driver requests with filters
     */
    async getDriverRequests(filters: ListDriverRequestDto): Promise<DriverRequest[]> {
        try {
            const criteria = {};
            if (filters && Object.keys(filters).length) {
                for (const field in filters) {
                    const value = filters[field];

                    if (value !== null && value !== undefined && value !== '' && value !== 0)
                        criteria[field] = value;
                }
            }

            const qb = this.driverRequestRepository.createQueryBuilder('dr')
                .select('dr.*')
                .leftJoin('companies', 'c', 'c.id = dr.requesting_company_id')
                .addSelect('c.name', 'company_name');

            for (const field in criteria) {
                const params = { [field]: criteria[field] };
                switch (field) {
                    case 'id':
                        if (!Array.isArray(params[field]))
                            params[field] = [params[field]];
                        qb.andWhere(`dr.${field} = ANY(:${field})`, params);
                        break;
                    case 'name':
                        params[field] = `%${params[field].trim().toLowerCase()}%`;
                        qb.andWhere(`LOWER(dr.${field}) LIKE :${field}`, params);
                        break;
                    case 'requesting_company_id':
                        qb.andWhere(`dr.${field} = :${field}`, params);
                        break;
                    case 'status':
                        qb.andWhere(`dr.${field} = :${field}`, params);
                        break;
                    default:
                        break;
                }
            }

            qb.orderBy('dr.created_at', 'DESC');

            return await qb.getRawMany();
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Get driver requests for a specific company
     */
    async getMyDriverRequests(companyId: number): Promise<DriverRequest[]> {
        return this.getDriverRequests({ requesting_company_id: companyId });
    }

    /**
     * Generate a temporary password
     */
    private generateTempPassword(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}
