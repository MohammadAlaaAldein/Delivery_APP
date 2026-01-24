import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { FastifyRequest } from 'fastify';
import { ErrorKeys } from 'src/common/api-response';
import { ShopRequest, ShopRequestStatus } from './entities/shop-request.entity';
import { CreateShopRequestDto } from './dto/create-shop-request.dto';
import { UpdateShopRequestDto } from './dto/update-shop-request.dto';
import { ListShopRequestDto } from './dto/list-shop-request.dto';
import { ShopsService } from '../shops/shops.service';
import { CompaniesShopsService } from '../companies-shops/companies-shops.service';

@Injectable()
export class ShopRequestsService {

    constructor(
        @InjectRepository(ShopRequest)
        private readonly shopRequestRepository: Repository<ShopRequest>,
        private readonly shopsService: ShopsService,
        private readonly companiesShopsService: CompaniesShopsService,
        private connection: DataSource,
    ) { }

    private getRepository(entityManager?: EntityManager): Repository<ShopRequest> {
        return entityManager ? entityManager.getRepository(ShopRequest) : this.connection.getRepository(ShopRequest);
    }

    /**
     * Create a new shop request (Company endpoint)
     */
    async create(companyId: number, createDto: CreateShopRequestDto, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const shopRequest = this.shopRequestRepository.create({
                ...createDto,
                requesting_company_id: companyId,
                status: ShopRequestStatus.PENDING,
            });

            await this.shopRequestRepository.save(shopRequest);

            return { err: null, res: shopRequest };
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Update a shop request (Admin endpoint)
     */
    async update(id: number, fields: UpdateShopRequestDto, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const allowedFields = [
                'name',
                'city',
                'area',
                'street',
                'building',
                'latitude',
                'longitude',
                'address',
                'phone',
                'whatsapp',
                'email',
                'license_number',
                'license_type',
                'license_expiry_date',
                'admin_notes',
            ];

            const shopRequest = (await this.getShopRequests({ id }))[0];
            if (!shopRequest) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            // Don't allow editing approved requests
            if (shopRequest.status === ShopRequestStatus.APPROVED) {
                return { err: ErrorKeys.INVALID_REQUEST };
            }

            const updateFields: Partial<UpdateShopRequestDto> = {};

            for (const field in fields) {
                if (allowedFields.includes(field))
                    updateFields[field] = fields[field];
            }

            if (Object.keys(updateFields).length) {
                await this.shopRequestRepository.createQueryBuilder()
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
     * Approve a shop request - creates the shop and links it to the requesting company
     */
    async approve(id: number, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const shopRequest = (await this.getShopRequests({ id }))[0];
            if (!shopRequest) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            if (shopRequest.status !== ShopRequestStatus.PENDING) {
                return { err: ErrorKeys.INVALID_REQUEST };
            }

            // Create the shop
            const shopData = {
                name: shopRequest.name,
                is_active: true,
                city: shopRequest.city,
                area: shopRequest.area,
                street: shopRequest.street,
                building: shopRequest.building,
                latitude: shopRequest.latitude,
                longitude: shopRequest.longitude,
                address: shopRequest.address,
                phone: shopRequest.phone,
                whatsapp: shopRequest.whatsapp,
                email: shopRequest.email,
                license_number: shopRequest.license_number,
                license_type: shopRequest.license_type,
                license_expiry_date: shopRequest.license_expiry_date ? shopRequest.license_expiry_date.toISOString().split('T')[0] : undefined,
                company_ids: [shopRequest.requesting_company_id],
            };

            const createResult = await this.shopsService.create(shopData, options);
            if (createResult.err) {
                return createResult;
            }

            // Delete the request after successful approval
            await this.shopRequestRepository.createQueryBuilder()
                .delete()
                .where('id = :id', { id })
                .execute();

            return { err: null, res: { shop: createResult } };
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Reject a shop request - deletes the request
     */
    async reject(id: number, adminNotes?: string, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const shopRequest = (await this.getShopRequests({ id }))[0];
            if (!shopRequest) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            if (shopRequest.status !== ShopRequestStatus.PENDING) {
                return { err: ErrorKeys.INVALID_REQUEST };
            }

            // Soft delete the request
            await this.shopRequestRepository.createQueryBuilder()
                .update()
                .set({
                    status: ShopRequestStatus.REJECTED,
                    admin_notes: adminNotes || shopRequest.admin_notes,
                })
                .where('id = :id', { id })
                .execute();

            return { err: null, res: { request_status: ShopRequestStatus.REJECTED } };
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Delete a shop request (admin)
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
     * Company updates their own shop request (only if pending or rejected - rejected becomes pending again)
     */
    async updateMyRequest(id: number, companyId: number, fields: UpdateShopRequestDto, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const allowedFields = [
                'name',
                'city',
                'area',
                'street',
                'building',
                'latitude',
                'longitude',
                'address',
                'phone',
                'whatsapp',
                'email',
                'license_number',
                'license_type',
                'license_expiry_date',
            ];

            const shopRequest = (await this.getShopRequests({ id }))[0];
            if (!shopRequest) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            // Verify ownership
            if (shopRequest.requesting_company_id !== companyId) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            // Only allow editing if pending or rejected
            if (shopRequest.status !== ShopRequestStatus.PENDING && shopRequest.status !== ShopRequestStatus.REJECTED) {
                return { err: ErrorKeys.INVALID_REQUEST };
            }

            const updateFields: Partial<UpdateShopRequestDto> = {};

            for (const field in fields) {
                if (allowedFields.includes(field))
                    updateFields[field] = fields[field];
            }

            // If request was rejected, reset status to pending (resubmit)
            if (shopRequest.status === ShopRequestStatus.REJECTED) {
                updateFields['status'] = ShopRequestStatus.PENDING;
                updateFields['admin_notes'] = null; // Clear admin notes on resubmit
            }

            if (Object.keys(updateFields).length) {
                await this.shopRequestRepository.createQueryBuilder()
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
     * Company deletes their own shop request (only if pending or rejected)
     */
    async deleteMyRequest(id: number, companyId: number, options?: { req?: FastifyRequest }): Promise<any> {
        try {
            const shopRequest = (await this.getShopRequests({ id }))[0];
            if (!shopRequest) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            // Verify ownership
            if (shopRequest.requesting_company_id !== companyId) {
                return { err: ErrorKeys.NOT_FOUND };
            }

            // Only allow deleting if pending or rejected
            if (shopRequest.status !== ShopRequestStatus.PENDING && shopRequest.status !== ShopRequestStatus.REJECTED) {
                return { err: ErrorKeys.INVALID_REQUEST };
            }

            await this.shopRequestRepository.createQueryBuilder().softDelete().where({ id }).execute();

            return { err: null };
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Get shop requests with filters
     */
    async getShopRequests(filters: ListShopRequestDto): Promise<ShopRequest[]> {
        try {
            const criteria = {};
            if (filters && Object.keys(filters).length) {
                for (const field in filters) {
                    const value = filters[field];

                    if (value !== null && value !== undefined && value !== '' && value !== 0)
                        criteria[field] = value;
                }
            }

            const qb = this.shopRequestRepository.createQueryBuilder('sr')
                .select('sr.*')
                .leftJoin('companies', 'c', 'c.id = sr.requesting_company_id')
                .addSelect('c.name', 'company_name');

            for (const field in criteria) {
                const params = { [field]: criteria[field] };
                switch (field) {
                    case 'id':
                        if (!Array.isArray(params[field]))
                            params[field] = [params[field]];
                        qb.andWhere(`sr.${field} = ANY(:${field})`, params);
                        break;
                    case 'name':
                        params[field] = `%${params[field].trim().toLowerCase()}%`;
                        qb.andWhere(`LOWER(sr.${field}) LIKE :${field}`, params);
                        break;
                    case 'requesting_company_id':
                        qb.andWhere(`sr.${field} = :${field}`, params);
                        break;
                    case 'status':
                        qb.andWhere(`sr.${field} = :${field}`, params);
                        break;
                    default:
                        break;
                }
            }

            qb.orderBy('sr.created_at', 'DESC');

            return await qb.getRawMany();
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Get shop requests for a specific company
     */
    async getMyShopRequests(companyId: number): Promise<ShopRequest[]> {
        return this.getShopRequests({ requesting_company_id: companyId });
    }
}
