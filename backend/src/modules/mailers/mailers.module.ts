import { Global, Module } from '@nestjs/common';
import { MailersService } from './mailers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mailer } from './entities/mailer.entity';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([
			Mailer
		]),
	],
	providers: [MailersService],
	exports: [MailersService],
})
export class MailersModule { }
