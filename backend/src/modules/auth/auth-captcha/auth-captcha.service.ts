import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { generateCaptcha } from 'src/common/captcha';
import { CAPTCHA_IMAGE_TTL } from 'src/common/constants';

@Injectable()
export class AuthCaptchaService {
	private CACHE_KEYS = {
		RANDOM_CAPTCHA: 'random_captcha_v1',
	};

	constructor(
		private redisService: RedisService,
	) {}

	async getCaptcha(key: string, getSvg: boolean) {
		try {
			const captcha = await generateCaptcha(getSvg);
			const cacheKey = this.CACHE_KEYS.RANDOM_CAPTCHA;

			await this.redisService.set(cacheKey, captcha.text, CAPTCHA_IMAGE_TTL, false, key);
			return captcha.img;
		} catch (ex) {
			throw ex;
		}
	}

	async verifyCaptcha(key: string, captchaText: string = ''): Promise<Boolean> {
		try {
			const cacheKey = this.CACHE_KEYS.RANDOM_CAPTCHA;
			const response = await this.redisService.get(cacheKey, key, false) || '';

			if (captchaText.toLowerCase() != response.toLowerCase())
				return false;

			await this.redisService.del([cacheKey + '_' + key]);
			return true;
		} catch (ex) {
			throw ex;
		}
	}
}
