import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-shop.dto';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {}