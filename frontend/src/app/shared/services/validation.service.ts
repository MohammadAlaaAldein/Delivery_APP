import { Injectable } from '@angular/core';
import { cloneDeep as _cloneDeep } from 'lodash-es';
import validationObj from '../../../../../shared/validation/validationRules.json';

@Injectable({ providedIn: 'root' })
export class ValidationService {
	constructor() // private commonData: CommonDataService // private usersService: UsersService,
	{}

	empty(data) {
		if (data instanceof Date) {
			return false;
		}
		if (typeof data == 'number' || typeof data == 'boolean') {
			return false;
		}
		if (typeof data == 'undefined' || data === null) {
			return true;
		}
		if (typeof data.length != 'undefined') {
			return data.length == 0;
		}
		var count = 0;
		for (var i in data) {
			if (data.hasOwnProperty(i)) count++;
		}
		return count == 0;
	}

	dataValidator(type, options, value) {
		var isValid = false;
		if (options.allowValue && value === options.allowValue) {
			return true;
		}
		switch (type) {
			case 'required':
				isValid = true; // !this.empty(value);
				break;
			case 'integer':
				if (options.allowEmpty && this.empty(value)) {
					isValid = true;
					break;
				}
				// if(options.min == 'currentYear')
				// 	options.min = moment().year();
				// if(options.max == 'currentYear')
				// 	options.max = moment().year();
				// if(options.max == 'nextYear')
				// 	options.max = moment().year() + 1;

				if (value == parseInt(value)) {
					value = parseInt(value);

					var validMin = true,
						validMax = true,
						validStep = true;

					if (typeof options.min !== 'undefined' && value < options.min) validMin = false;
					if (typeof options.max !== 'undefined' && value > options.max) validMax = false;
					if (typeof options.step !== 'undefined' && value % options.step != 0) validStep = false;

					if (validMin && validMax && validStep) isValid = true;
				}
				break;

			case 'float':
				if (options.allowEmpty && this.empty(value)) {
					isValid = true;
					break;
				}
				if (value == parseFloat(value)) {
					value = parseFloat(value);

					var validMin = true,
						validMax = true,
						validStep = true;

					if (typeof options.min !== 'undefined' && value < options.min) validMin = false;
					if (typeof options.max !== 'undefined' && value > options.max) validMax = false;
					if (typeof options.step !== 'undefined' && value % options.step != 0) validStep = false;

					if (typeof options.precision !== 'undefined') {
						let factor = Math.pow(10, options.precision);
						let roundedValue = Math.round(value * factor) / factor;
						if (value != roundedValue) validStep = false;
					}

					if (validMin && validMax && validStep) isValid = true;
				}
				break;

			case 'boolean':
				if (typeof value === 'boolean' || (options.allowNull && value === null)) isValid = true;
				break;

			case 'string':
				if (options.allowEmpty && this.empty(value)) {
					isValid = true;
					break;
				}

				if (typeof value === 'string') {
					var validMin = true,
						validMax = true;
					value = value.trim();
					let strLen = value.length;

					if (typeof options.min !== 'undefined' && strLen < options.min) validMin = false;
					if (typeof options.max !== 'undefined' && strLen > options.max) validMax = false;

					if (validMin && validMax) isValid = true;
				}
				break;

			case 'hex':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				var regex = /\b[0-9A-Fa-f]+\b/gi;
				var validMin = true,
					validMax = true;
				let strLen = value.length;

				if (typeof options.value !== 'undefined' && strLen < options.min) validMin = false;
				if (typeof options.max !== 'undefined' && strLen > options.max) validMax = false;

				if (validMin && validMax && regex.test(value)) isValid = true;
				break;

			case 'password':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				if (typeof value === 'string') {
					// isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/.test(value); // one upper, one lower, one digit, at least 8 characters.
					isValid = value.length > 4;
				}
				break;
			case 'email':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				if (typeof value === 'string') {
					isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) && value.length <= 255;
				}
				break;
			case 'userRole':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				isValid = +value >= 1;
				break;

			case 'arrayOf':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				if (!Array.isArray(value) || value.length == 0) {
					break;
				}
				let validArray = true;
				switch (options.subType) {
					case 'integers':
						for (const ele of value) {
							if (typeof ele != 'number') {
								validArray = false;
								break;
							}
							if (typeof options.min !== 'undefined' && ele < options.min) {
								isValid = false;
								break;
							}
							if (typeof options.max !== 'undefined' && ele > options.max) {
								isValid = false;
								break;
							}
						}
						break;
					case 'strings':
						for (const ele of value) {
							if (typeof ele != 'string') {
								validArray = false;
								break;
							}
						}
						break;
					case 'objects':
						for (const ele of value) {
							if (typeof ele != 'object') {
								validArray = false;
								break;
							}
						}
						break;
					// case 'emailNotifications':
					// 	let list = Object.values( this.usersService.EMAIL_NOTIFICATIONS);
					// 	for (const ele of value) {
					// 		if(!list.includes(ele)) {
					// 			validArray = false;
					// 			break;
					// 		}
					// 	}
					// break;
				}
				isValid = validArray;
				break;

			case 'inArray':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				switch (options.subType) {
					case 'integer':
						if (value == parseInt(value)) {
							value = parseInt(value);
						}
						break;
				}
				if (options.values.indexOf(value) > -1) isValid = true;
				break;

			case 'inType':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				let values;
				isValid = values && values.includes(value);
				break;

			case 'notInArray':
				switch (options.subType) {
					case 'float':
						if (value == parseFloat(value)) {
							value = parseFloat(value);

							if (options.values.indexOf(value) == -1) isValid = true;
						}
						break;
				}
				break;

			case 'phone':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				isValid = /^(\+\d{1,2}\s*)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value); // optional + with 15 digits maximum
				break;

			case 'date':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				isValid = value instanceof Date && !isNaN(value.getTime());
				if (!isValid) {
					// maybe it's string format
					let d = new Date(value);
					isValid = d instanceof Date && !isNaN(d.getTime());
				}
				break;

			case 'dateOnly':
				{
					if (this.empty(value)) {
						if (options.allowEmpty) isValid = true;
						break;
					}
					isValid = value instanceof Date && !isNaN(value.getTime());
					if (!isValid) {
						// maybe it's string format
						let d = new Date(value);
						isValid = d instanceof Date && !isNaN(d.getTime());
					}
					if (!isValid) break;

					// let parsedDate = moment(value).format('YYYY-MM-DD');
					// if(options.min == 'today')
					// 	options.min = moment().format('YYYY-MM-DD');
					// if(options.max == 'today')
					// 	options.max = moment().format('YYYY-MM-DD');
					// if(options.min == 'tomorrow')
					// 	options.min = moment().add(1, 'days').format('YYYY-MM-DD');
					// if(options.max == 'tomorrow')
					// 	options.max = moment().add(1, 'days').format('YYYY-MM-DD');
					// if(options.min == 'firstDayOfPreviousQuarter')
					// 	options.min = moment().subtract(1, 'quarter').startOf('quarter').format('YYYY-MM-DD');
					// if(options.min == 'secondDayOfPreviousQuarter')
					// 	options.min = moment().subtract(1, 'quarter').startOf('quarter').add(1, 'day').format('YYYY-MM-DD');
					// if(options.max == 'firstDayOfPreviousQuarter')
					// 	options.max = moment().subtract(1, 'quarter').startOf('quarter').format('YYYY-MM-DD');

					// if(options.min && options.max){
					// 	isValid = moment(parsedDate).isBetween(options.min, options.max, undefined, '[]');
					// }
					//
					// if(!options.min && options.max){
					// 	isValid = moment(parsedDate).isSameOrBefore(options.max);
					// }
					// if(options.min && !options.max){
					// 	isValid = moment(parsedDate).isSameOrAfter(options.min);
					// }

					if (!isValid) break;

					// if (options.past) {
					// 	isValid = isValid && moment(parsedDate).unix() >= moment().startOf('day').subtract(options.past.val, options.past.unit).unix();
					// }
					// if (options.future) {
					// 	isValid = isValid && moment(parsedDate).unix() <= moment().endOf('day').add(options.future.val, options.future.unit).unix();
					// }
				}
				break;

			case 'time':
				if (typeof value === 'string') {
					var patt = /^((0|1)[0-9]|2[0-4]):[0-5][0-9]$/;
					if (patt.test(value)) {
						var time = value.split(':');
						var timeInMints = parseInt(time[0]) * 60 + parseInt(time[1]);

						var validMin = true,
							validMax = true,
							validStep = true;

						if (typeof options.min !== 'undefined') {
							var minTime = options.min.split(':');
							var minTimeInMints = parseInt(minTime[0]) * 60 + parseInt(minTime[1]);

							if (timeInMints < minTimeInMints) validMin = false;
						}

						if (typeof options.max !== 'undefined') {
							var maxTime = options.max.split(':');
							var maxTimeInMints = parseInt(maxTime[0]) * 60 + parseInt(maxTime[1]);

							if (timeInMints > maxTimeInMints) validMin = false;
						}

						if (typeof options.step !== 'undefined' && timeInMints % options.step != 0) validStep = false;

						if (validMin && validMax && validStep) isValid = true;
					}
				}
				break;

			case 'daysMask':
				var days = [0, 1, 2, 3, 4, 5, 6];
				if (typeof value === 'object') {
					var withinDays = true;
					value.forEach(function (ele) {
						if (withinDays && days.indexOf(ele) == -1) {
							withinDays = false;
						}
					});

					if (withinDays) isValid = true;
				}
				break;

			case 'dateRange':
				var validMin = true,
					validMax = true;

				var DateInSecs = new Date(value).getTime();

				if (typeof options.min !== 'undefined' && DateInSecs < options.min.getTime()) validMin = false;
				if (typeof options.max !== 'undefined' && DateInSecs > options.max.getTime()) validMax = false;

				if (validMin && validMax) isValid = true;
				break;

			case 'regex':
				if (options.allowEmpty && this.empty(value)) {
					isValid = true;
					break;
				}

				if (typeof value == 'string') value = value.trim();

				if (options.patt && options.patt.test(value)) isValid = true;
				if (options.strPatt && new RegExp(options.strPatt).test(value)) isValid = true;
				break;

			case 'arraySubset':
				if (typeof value === 'object') {
					var withinDays = true;
					value.forEach(function (ele) {
						if (withinDays && options.values.indexOf(ele) == -1) {
							withinDays = false;
						}
					});

					if (withinDays) isValid = true;
				}
				break;

			case 'notNull':
				if (typeof value === 'string') {
					var trimmedValue = value.trim();
					if (trimmedValue.length > 0) isValid = true;
				}
				break;
			case 'battModel':
				value = (value || '').trim();
				if (options.allowEmpty && this.empty(value)) {
					isValid = true;
					break;
				}

				// the battery model MUST meet the following format VV-XXX-PP
				let valueSplitted = value.split('-');
				if (valueSplitted.length === 1) valueSplitted = valueSplitted[0].split('‐');

				let vv = valueSplitted[0],
					xxx = valueSplitted[1],
					pp = valueSplitted[2];

				// VV(Number of cells in the battery pack (2 digits))  and can’t be zero
				// XXX: Plate amp-hour Capacity (can be 2 or 3 digits) and can’t be zero
				// PP: Number of plates (1 or 2 digits) and can’t be zero
				if (
					vv == parseInt(vv) &&
					vv.length === 2 &&
					parseInt(vv) >= 6 &&
					xxx == parseInt(xxx) &&
					[2, 3].includes(xxx.length) &&
					parseInt(xxx) >= 8 &&
					pp == parseInt(pp) &&
					[2, 1].includes(pp.length) &&
					parseInt(pp) >= 3 &&
					parseInt(pp) % 2 == 1
				)
					isValid = true;
				break;

			case 'allowedStates':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				// isValid = this.commonData.getStateConfig().allowedStates.includes(value);
				isValid = true;
				break;

			case 'states':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				// isValid = this.commonData.getUSAStates().map(({id})=>id).includes(value);
				isValid = true;
				break;

			case 'allowedClasses':
				if (this.empty(value)) {
					if (options.allowEmpty) isValid = true;
					break;
				}
				// isValid = this.commonData.allowedClasses().includes(value);
				isValid = true;
				break;

			case 'truckOwnership':
				// if(options.allowEmpty && this.empty(value)) {
				// 	isValid = true;
				// 	break;
				// }
				// isValid = Object.values(OwnershipType).includes(value);
				isValid = true;
				break;
		}

		if (!isValid) console.log(options, value);
		return isValid;
	}

	getFormValidationRules(formName) {
		return _cloneDeep(validationObj[formName]);
	}

	getFormRequiredFields(formName) {
		let requiredFields = [];
		let validationRules = this.getFormValidationRules(formName);
		for (let field in validationRules) {
			let isRequired = validationRules[field].filter((rule) => rule.type == 'required');
			if (isRequired.length) requiredFields.push(field);
		}
		return requiredFields;
	}

	/**
	 *
	 * @param data
	 * @param formName
	 * @param validateFields fields to validate. If null, validate all.
	 */
	validateForm(data: any, formName: any, validateFields?: any, options?: any) {
		let invalidFields = [];
		options = options || {};
		let validationRules = this.getFormValidationRules(formName);

		let toValidate = data;
		if (validateFields) toValidate = validateFields;

		let optionalFields = options.optionalFields || [];
		let mandatoryFields = options.mandatoryFields || [];
		for (let field in toValidate) {
			if (validateFields) field = toValidate[field];

			let rules = validationRules[field] || [];

			if (invalidFields.indexOf(field) == -1) {
				for (const rule of rules) {
					if (optionalFields.includes(field)) rule.allowEmpty = true;
					else if (mandatoryFields.includes(field)) delete rule.allowEmpty;
					var isValid = this.dataValidator(rule.type, rule, data[field]);
					if (!isValid) invalidFields.push(field);
				}
			}
		}

		return invalidFields;
	}
}
