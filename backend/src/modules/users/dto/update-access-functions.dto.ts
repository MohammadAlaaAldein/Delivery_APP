import { IsEnum, IsOptional, IsObject, IsNotEmpty, IsNumber } from 'class-validator';

export enum AccessFunctionLevel {
	READ = 'read',
	WRITE = 'write',
	NO_ACCESS = 'noAccess',
}

export class AccessFunctionsDto {
	@IsEnum(AccessFunctionLevel)
	@IsOptional()
	admin?: AccessFunctionLevel;

	@IsEnum(AccessFunctionLevel)
	@IsOptional()
	client?: AccessFunctionLevel;

	//! we need to check if we need these access functions (cm, management_function) 
	@IsEnum(AccessFunctionLevel)
	@IsOptional()
	cm?: AccessFunctionLevel;

	@IsEnum(AccessFunctionLevel)
	@IsOptional()
	management_function?: AccessFunctionLevel;
}

export class UpdateAccessFunctionsDto {
	@IsObject()
	@IsNotEmpty()
	access_functions: AccessFunctionsDto;

	@IsNotEmpty()
	@IsNumber()
	user_id: number;
}