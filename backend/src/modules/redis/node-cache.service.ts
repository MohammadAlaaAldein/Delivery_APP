import { Injectable } from '@nestjs/common';
import * as NodeCache from 'node-cache';

@Injectable()
export class NodeCacheService {
	private nodeCache: NodeCache;
	constructor() {
		this.nodeCache = new NodeCache.default();
	}

	getInstance(): NodeCache {
		return this.nodeCache;
	}
}
