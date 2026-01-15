import 'fastify';
import { User } from './modules/users/entities/user.entity';
import { EntityManager } from 'typeorm';

module 'fastify' {
	interface FastifyRequest {
		user?: User;
	}

	interface Session {
		user?: User;
	}
}