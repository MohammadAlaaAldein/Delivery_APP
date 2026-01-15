import { Body, Controller, Post, Req } from "@nestjs/common";
import { handleThrowApiError } from "src/common/api-response";
import { getControllersPrefixes } from "src/common/utilities";
import { CreateShopDto } from "./dto/create-shop.dto";
import { FastifyRequest } from "fastify";
import { ShopsService } from "./shops.service";

@Controller(getControllersPrefixes('shops'))

export class ShopsController {

	readonly THROW_API_MODULE: string = 'shops';

	constructor(
		private readonly shopsService: ShopsService,
	) { }

	@Post('create')
	async registerUser(
		@Body() createShopDto: CreateShopDto,
		@Req() req: FastifyRequest,
	) {
		return await this.shopsService.create(createShopDto);
	}

}
