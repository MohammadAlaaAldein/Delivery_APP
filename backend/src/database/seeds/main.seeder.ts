// import { User } from '../../modules/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class MainSeeder implements Seeder {
	public async run(dataSource: DataSource): Promise<any> {
		// console.log('seeding Users...');

		// const userRepository = dataSource.getRepository(User);
		// await userRepository.query('TRUNCATE table public.users RESTART IDENTITY');
		// await userRepository.save([
		// 	{ name: 'Mahmoud Alhroub' },
		// ]);
	}
}