import dbConfig from '../../config/data-source';
import { DataSource, DataSourceOptions } from 'typeorm';
import { runSeeders, SeederOptions } from 'typeorm-extension';
import { MainSeeder } from './main.seeder';

const options: DataSourceOptions & SeederOptions = {
	...dbConfig(),
	seeds: [MainSeeder],
};

const dataSource = new DataSource(options);
dataSource.initialize().then(async () => {
	await dataSource.synchronize(false);
	await runSeeders(dataSource);
	process.exit();
});