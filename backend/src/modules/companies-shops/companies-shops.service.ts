import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CompanyShop } from './company-shop.entity';

@Injectable()
export class CompaniesShopsService {

	constructor(
		@InjectRepository(CompanyShop)
		private readonly companyShopRepository: Repository<CompanyShop>,
	) { }

	/**
	 * Update the relationship between a company/shop and its related entities
	 * @param type - 'company' or 'shop' - determines which side we're updating from
	 * @param entityId - the ID of the company or shop we're updating
	 * @param relatedIds - array of IDs for the related entities
	 */
	async updateRelations(type: 'company' | 'shop', entityId: number, relatedIds: number[]): Promise<void> {
		const fieldName = type === 'company' ? 'company_id' : 'shop_id';
		const relatedFieldName = type === 'company' ? 'shop_id' : 'company_id';

		// Get existing relations
		const existingRelations = await this.companyShopRepository.find({
			where: { [fieldName]: entityId },
		});

		const existingRelatedIds = existingRelations.map(r => r[relatedFieldName]);
		const newRelatedIds = relatedIds || [];

		// Find IDs to add (in newRelatedIds but not in existingRelatedIds)
		const idsToAdd = newRelatedIds.filter(id => !existingRelatedIds.includes(id));

		// Find IDs to remove (in existingRelatedIds but not in newRelatedIds)
		const idsToRemove = existingRelatedIds.filter(id => !newRelatedIds.includes(id));

		// Add new relations
		if (idsToAdd.length > 0) {
			const newRelations = idsToAdd.map(relatedId => ({
				[fieldName]: entityId,
				[relatedFieldName]: relatedId,
			}));
			await this.companyShopRepository.save(newRelations);
		}

		// Remove old relations
		if (idsToRemove.length > 0) {
			await this.companyShopRepository.delete({
				[fieldName]: entityId,
				[relatedFieldName]: In(idsToRemove),
			});
		}
	}

	/**
	 * Get related shop IDs for a company
	 */
	async getShopIdsByCompanyId(companyId: number): Promise<number[]> {
		const relations = await this.companyShopRepository.find({
			where: { company_id: companyId },
			select: ['shop_id'],
		});
		return relations.map(r => r.shop_id);
	}

	/**
	 * Get related company IDs for a shop
	 */
	async getCompanyIdsByShopId(shopId: number): Promise<number[]> {
		const relations = await this.companyShopRepository.find({
			where: { shop_id: shopId },
			select: ['company_id'],
		});
		return relations.map(r => r.company_id);
	}

	/**
	 * Delete all relations for a company
	 */
	async deleteByCompanyId(companyId: number): Promise<void> {
		await this.companyShopRepository.delete({ company_id: companyId });
	}

	/**
	 * Delete all relations for a shop
	 */
	async deleteByShopId(shopId: number): Promise<void> {
		await this.companyShopRepository.delete({ shop_id: shopId });
	}
}
