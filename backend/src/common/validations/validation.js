const Validator = require('./validator');
const validatorObj = new Validator();

const validation = {

	validateSettings: function (data, device) {
		const invalidFields = [];
		const validationRules = this.getValidationRules();

		for (const field in data) {
			let rules = validationRules[field] || [];

			if (objectFields.includes(field)) {
				for (const subField in data[field]) {
					if (!invalidFields.includes(subField)) {
						rules = validationRules[field][subField] || [];
						for (const _rule of rules) {
							const isValid = validatorObj.dataValidator(_rule.type, _rule, data[field][subField]);
							if (!isValid)
								invalidFields.push(subField);
						}
					}
				}
			} else if (invalidFields.indexOf(field) == -1) {
				for (const rule of rules) {
					const isValid = validatorObj.dataValidator(rule.type, rule, data[field]);
					if (!isValid)
						invalidFields.push(field);
				}
			}
		}
		return invalidFields;
	},

	mergeObjects: function (obj1, obj2, obj3) {

		obj3 = obj3 || {};
		var resultObj = {};

		for (let key in obj1) {
			resultObj[key] = obj1[key];
		}

		for (let key in obj2) {
			resultObj[key] = obj2[key];
		}

		for (let key in obj3) {
			resultObj[key] = obj3[key];
		}

		return resultObj;
	},

	getFormValidationRules: function (formName) {
		const emailAddress = { type: 'regex', patt: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ };

		const rules = {
			'registerUser': {
				name: [{ type: 'name' }],
				email: [{ type: 'string', min: 1, max: 255 }, emailAddress],
				password: [{ type: 'password' }],
			},
			'addUser': {
				name: [{ type: 'name' }],
				email: [emailAddress],
				password: [{ type: 'password' }],
			},
			'editUser': {
				name: [{ type: 'name' }],
				email: [emailAddress],
				password: [{ type: 'password', allowEmpty: true }],
			},
			'editUserPassword': {
				new_password: [{ type: 'password' }],
			},
			'forgotPassword': {
				email: [{ type: 'string', min: 1 }, emailAddress],
				phone: [{ type: 'phone' }],
			},
		};

		return rules[formName];
	},

	validateForm: function (data, formName, validationRules) {

		let invalidFields = [];

		if (!validationRules)
			validationRules = this.getFormValidationRules(formName);

		for (let field in data) {
			let rules = validationRules[field] || [];

			if (!invalidFields.includes(field)) {
				for (const rule of rules) {
					var isValid = validatorObj.dataValidator(rule.type, rule, data[field]);
					if (!isValid && !invalidFields.includes(field))
						invalidFields.push(field);
				}
			}
		}
		return invalidFields;
	},

	fwSupportedFeatures: function (feature, fw) {
		return false;
	},

	decimal2binary: function (decimal, bitsMinLength = 1) {
		let result = (decimal >>> 0).toString(2);
		if (!result || result.length < bitsMinLength) {
			result = '0'.repeat(bitsMinLength - result.length) + result;
		}
		return result;
	},
};
module.exports = validation;