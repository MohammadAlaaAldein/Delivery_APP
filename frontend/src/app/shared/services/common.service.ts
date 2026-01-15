import { Injectable } from '@angular/core';
import { DecimalPipe, Location } from '@angular/common';
import moment from 'moment';
import { difference as _difference } from 'lodash-es';
import { TranslateService } from '@ngx-translate/core';

export type TDocumentTypes = {
	proof_of_ownership: { id: string; label: string }[];
	proof_of_operation: { id: string; label: string }[];
};
import { cloneDeep as _cloneDeep } from 'lodash-es';
import { Validators } from '@angular/forms';
import { CommonDataService } from './common-data.service';

@Injectable({
	providedIn: 'root'
})
export class CommonService {
	constructor(
		private translate: TranslateService,
		private location: Location,
		private commonDataService: CommonDataService
	) { }

	TEMPERATURE_CONFIG = {
		min_temperature: -50,
		max_temperature: 100,
		min_hw_version: 'C',
		FW_VERSION: '0.5.0'
	};

	getDomainName() {
		console.log('getDomainName');

		const angularRoute = this.location.path();
		console.log(angularRoute);

		const url = window.location.href;
		console.log(url);

		const domain = url.replace(angularRoute, '');
		console.log(domain);

		return domain;
	}

	getCaptchaUrl() {
		let captchaKey = this.genRandomString(10);
		const captchUrl = this.getDomainName() + '/api/users/captchaImage?captchaKey=' + captchaKey;
		return {
			url: captchUrl,
			key: captchaKey
		};
	}

	genRandomString(len) {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

		for (let i = 0; i < len; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}

	nowTime() {
		return moment().utc().unix();
	}

	getSanitizedFormValue(data: any[], fields: any) {
		const raw = data;
		const sanitized: any = {};

		for (const key in raw) {
			const type = fields[key]?.type;

			if (type === 'number')
				sanitized[key] = raw[key] !== null && raw[key] !== '' ? Number(raw[key]) : null;
			else
				sanitized[key] = raw[key] !== null && raw[key] !== '' ? raw[key] : null;

			if (type === 'checkbox')
				sanitized[key] = +raw[key];
		}

		return sanitized;
	}

	getRemainingPeriod(date, span, daysShift = 0) {
		let expiry = moment(date).add(span, 'years').add(daysShift, 'days');
		let years = expiry.diff(moment(), 'years');
		expiry.subtract(years, 'years');

		let months = expiry.diff(moment(), 'months');
		expiry.subtract(months, 'months');

		let days = expiry.diff(moment(), 'days');

		let vals = [];
		if (years > 0)
			vals.push(years + ' ' + this.translate.instant('g.years_value'));
		if (months > 0)
			vals.push(months + ' ' + this.translate.instant('g.months_value'));
		if (days > 0)
			vals.push(days + ' ' + this.translate.instant('g.days_value'));

		return vals.join(', ');
	}

	lpad(str, length, padString = '0') {
		while (str.length < length)
			str = padString + str;
		return str;
	}

	sortDataAlphabetically(data: string[], fieldName: string) {
		return data.sort((item1, item2) => item1[fieldName].toLowerCase() > item2[fieldName].toLowerCase() ? 1 : -1);
	}

	getRequireFieldsValidator(isRequired: boolean) {
		return isRequired ? [Validators.required, Validators.pattern(/\S+/)] : [];
	}

	showUserTimeZoneReference() {
		const userTimeZone = moment().utcOffset();
		return moment().utcOffset(userTimeZone).format('UTCZ');
	}

	getUTCTimestampFromZone(zoneId, unixTimestamp) {
		const zone = this.commonDataService.timeZoneMenu.find(item => item.id == zoneId);
		if (!zone || zone.id == 0)
			return unixTimestamp;

		let offset = zone.baseUtc;

		for (let i = 0; i < zone.changesTime.length; i++) {
			if (unixTimestamp >= zone.changesTime[i])
				offset += (i % 2 === 0 ? -1 : 1) * zone.changesValue;
		}

		return unixTimestamp + offset;
	}

	showFieldBasedOnTimeZone(fieldTimestamp: number) {
		const userTimeZone = this.commonDataService.getCurrentUserTimeZone();
		if (!userTimeZone)
			return fieldTimestamp;

		return this.getUTCTimestampFromZone(userTimeZone.value, fieldTimestamp);
	}

	asciiValue(str: string) {
		let sum = 0;
		const normalized = str.toLowerCase();
		for (let i = 0; i < normalized.length; i++) {
			sum += normalized.charCodeAt(i);
		}
		return sum;
	}
}
