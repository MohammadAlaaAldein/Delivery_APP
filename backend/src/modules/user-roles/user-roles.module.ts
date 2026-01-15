import { Module } from '@nestjs/common';
import { UserRolesService } from './user-roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from './entities/user-role.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			UserRole,
		]),
	],
	providers: [UserRolesService],
	exports: [UserRolesService],
})
export class UserRolesModule { }
