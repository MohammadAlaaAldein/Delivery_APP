const emailSubscriptions = [ 'PFCH', 'EUN', 'NEW_DEVICE_ADDED'];

module.exports = function(){
	return {
		hexStringReg: /^[a-fA-F0-9]{12}$/,

		PasswordStrengthMeter: {
			VERY_WEAK: 0,
			WEAK: 1,
			GOOD: 2,
			STRONG: 3,
			VERY_STRONG: 4,
		},
		empty(data) {
			if(typeof(data) == 'number' || typeof(data) == 'boolean') { 
				return false; 
			}
			if(typeof(data) == 'undefined' || data === null) {
				return true; 
			}
			if(typeof(data.length) != 'undefined') {
				return data.length == 0;
			}
			var count = 0;
			for(var i in data) {
				if(data.hasOwnProperty(i))
					count ++;
			}
			return count == 0;
		},
		calculatePasswordStrengthMeter(password) {
			if(!password || password.length < 8) {
				password = '';
			}
			const sum = +/[A-Z]/g.test(password) + +/[a-z]/g.test(password) + +/\d/g.test(password) + +/[^a-zA-Z\d]/g.test(password);
			return Math.min(Object.keys(this.PasswordStrengthMeter).length - 1, sum);
		},
		dataValidator: function(type, options, value) {
			var isValid = false;
			
			switch(type) {
				case 'integer':
					if (this.empty(value) && options.allowEmpty) {
						isValid = true;
						break;
					}
					if(value == parseInt(value)) {

						value = parseInt(value);

						var validMin = true, validMax = true, validStep = true;
						
						if(typeof(options.min) !== "undefined" && value < options.min)
							validMin = false;
						if(typeof(options.max) !== "undefined" && value > options.max)
							validMax = false;
						if(typeof(options.step) !== "undefined" && (value % options.step != 0))
							validStep = false;
						
						if(validMin && validMax && validStep)
							isValid = true;
					}
				break;
				
				case 'float':
					if (this.empty(value) && options.allowEmpty) {
						isValid = true;
						break;
					}
					if(value == parseFloat(value)) {

						value = parseFloat(value);
						
						var validMin = true, validMax = true, validStep = true;
						
						if(typeof(options.min) !== "undefined" && value < options.min)
							validMin = false;
						if(typeof(options.max) !== "undefined" && value > options.max)
							validMax = false;
						if(typeof(options.step) !== "undefined" && (value % options.step != 0))
							validStep = false;
						
						if(validMin && validMax && validStep)
							isValid = true;
					}
				break;
				
				case 'boolean':
					if(typeof(value) === "boolean")
						isValid = true;
				break;
				
				case 'string':
					if(this.empty(value) && options.allowEmpty){
						isValid = true;
						break;
					}
					if(typeof(value) === "string") {
						value = value.trim(); // QA team input the value as spaces.
						var validMin = true, validMax = true;
						var strLen = value.length;
						
						if(typeof(options.min) !== "undefined" && strLen < options.min)
							validMin = false;
						if(typeof(options.max) !== "undefined" && strLen > options.max)
							validMax = false;
						
						if(validMin && validMax)
							isValid = true;
					}
				break;

				case 'domainOrIP':
					if(this.empty(value) && options.allowEmpty){
						isValid = true;
						break;
					}
					if(typeof(value) === "string") {
						if (
							/^((?:(?:(?:\w[\.\-\+]?)*)\w)+)((?:(?:(?:\w[\.\-\+]?){0,62})\w)+)\.(\w{2,6})$/.test(value)
							|| /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
								value,
							)
						) {
							isValid = true;
						}
					}
				break;
				
				case 'hexString':
					if(this.empty(value) && options.allowEmpty){
						isValid = true;
						break;
					}
					
					if(typeof(value) === "string") {
						value = value.trim().replace(/:/g, "");
						isValid = this.hexStringReg.test(value);
					}
				break;

				case 'password':
					if(this.empty(value) && options.allowEmpty){
						isValid = true;
						break;
					}
					if(typeof(value) === "string") {
						// isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/.test(value); // one upper, one lower, one digit, at least 8 characters.
						// isValid = value.length > 4;
						if(value.trim().length > 0) {
							isValid = this.calculatePasswordStrengthMeter(value) >= this.PasswordStrengthMeter.GOOD;
						}
					}
				break;

				case 'inArray':
					switch(options.subType) {
						case 'integer':
							if(value == parseInt(value)) {
								value = parseInt(value);
							}
						break;
					}
					if(options.values.indexOf(value) > -1)
						isValid = true;
				break;

				case 'notInArray':
					outterSwitch:
					switch(options.subType) {
						case 'float':
							if(value == parseFloat(value)) {

								value = parseFloat(value);

								if(options.values.indexOf(value) == -1)
									isValid = true;
							}
						break;
						case 'string':
							if(typeof(value) === "string") {
								if(!options.values.includes(value))
									isValid = true;
							}
						break;
						case 'ip':
							if(typeof(value) === "string") {
								const parts = value.split('.');
								if(parts.length === 4) {
									for(let i = 0; i < parts.length; i++) {
										const parsed = parseInt(parts[i], 10);
										if(isNaN(parsed) || parsed < 0 || parsed > 255) {
											break outterSwitch;
										}
										parts[i] = parsed.toString();
									}
									value = parts.join('.');
									if(!options.values.includes(value))
										isValid = true;
								}
							}
						break;	
					}
				break;

				case 'phone':
					if(this.empty(value) && options.allowEmpty){
						isValid = true;
						break;
					}
					try {
						var PhoneNumberUtil = require('google-libphonenumber').PhoneNumberUtil;
						let lib = PhoneNumberUtil.getInstance();
						let num = lib.parse(value, 'us');
						isValid = lib.isValidNumber(num);
					} catch (error) {
						isValid = false;
					}
				break;

				case 'date':
					if(this.empty(value)){
						if(options.allowEmpty)
							isValid = true;
						break;
					}
					isValid = value instanceof Date && !isNaN(value.getTime());
					if(!isValid){ // maybe it's string format
						let d = new Date(value);
						isValid = d instanceof Date && !isNaN(d.getTime());
					}
				break;

				case 'time':
					if(typeof(value) === "string") {
						var patt = /^((0|1)[0-9]|2[0-4]):[0-5][0-9]$/;
						if(patt.test(value)) {
							var time = value.split(':');
							var timeInMints = parseInt(time[0]) * 60 + parseInt(time[1]);

							var validMin = true, validMax = true, validStep = true;;
						
							if(typeof(options.min) !== "undefined") {
								var minTime = options.min.split(':');
								var minTimeInMints = parseInt(minTime[0]) * 60 + parseInt(minTime[1]);

								 if(timeInMints < minTimeInMints)	
									validMin = false;
							}
							
							if(typeof(options.max) !== "undefined") {
								var maxTime = options.max.split(':');
								var maxTimeInMints = parseInt(maxTime[0]) * 60 + parseInt(maxTime[1]);

								 if(timeInMints > maxTimeInMints)	
									validMin = false;
							}
							
							if(typeof(options.step) !== "undefined" && (timeInMints % options.step != 0))
								validStep = false;

							if(validMin && validMax && validStep)
								isValid = true;
						}
					}
				break;

				case 'daysMask':
					var days = [0, 1, 2, 3, 4, 5, 6];
					if(typeof(value) === "object") {
						var withinDays = true;
						value.forEach(function(ele) {
							if(withinDays && days.indexOf(ele) == -1) {
								withinDays = false;
							}
						});

						if(withinDays)
							isValid = true;
					}
				break;
				
				case 'dateRange':
					var validMin = true, validMax = true;
					
					var DateInSecs = new Date(value).getTime();

					if(typeof(options.min) !== "undefined" && DateInSecs < options.min.getTime())
						validMin = false;
					if(typeof(options.max) !== "undefined" && DateInSecs > options.max.getTime())
						validMax = false;
					
					if(validMin && validMax)
						isValid = true;
				break;
				
				case 'regex':
					if(this.empty(value) && options.allowEmpty){
						isValid = true;
						break;
					}
					if(options.patt.test(value))
						isValid = true;
				break;

				case 'arraySubset':
					if(typeof(value) === "object") {
						var withinDays = true;
						value.forEach(function(ele) {
							if(withinDays && options.values.indexOf(ele) == -1) {
								withinDays = false;
							}
						});

						if(withinDays)
							isValid = true;
					}
				break;

				case 'arrayOf':
					if(Array.isArray(value)) {
						if(this.empty(value) && options.allowEmpty){
							isValid = true;
							break;
						}
						let validArray = true;
						switch(options.subType) {
							case 'integers':
								for (const ele of value) {
									if(typeof ele != 'number') {
										validArray = false;
										break;
									}
									if(options.hasOwnProperty('values') && !options.values.includes(ele)) {
										validArray = false;
										break;	
									}
									if(typeof(options.min) !== "undefined" && ele < options.min){
										isValid = false;
										break;
									}
									if(typeof(options.max) !== "undefined" && ele > options.max) {
										isValid = false;
										break;
									}
								}
								
							break;
						}
						isValid = validArray;
					}
				break;
				case 'name': {
					const min = +options.min || 1;
					const max = +options.max || 255;
					isValid = typeof(value) === "string" && value.length >= min && value.length <= max;
					break;
				}

				case 'email_sub':
					isValid = Array.isArray(value) && value.length == value.filter(i => emailSubscriptions.includes(i)).length;
				break;
			}

			return isValid;
		},
	};
};