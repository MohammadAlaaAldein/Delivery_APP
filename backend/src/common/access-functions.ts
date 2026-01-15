
/*	*		*		*		*		*		*	*
*	NOTE: ADD TRANSLATION UNDER access_func KEY	*
*	*		*		*		*		*		*	*/
export const ACCESS_FUNCTIONS = {
	SUPER_ADMIN: 'super_admin',
	MANAGEMENT_FUNCTION: 'management_function',
	ADMIN: 'admin',
	CLIENT: 'client',
	DEMO: 'demo',
	CM: 'cm',
	WEB_USER: 'web_user'
}

const accessFunctionsObj = {
	[ACCESS_FUNCTIONS.SUPER_ADMIN]: {},
	[ACCESS_FUNCTIONS.MANAGEMENT_FUNCTION]: { controlledBy: ACCESS_FUNCTIONS.SUPER_ADMIN, desc: [] },
	[ACCESS_FUNCTIONS.ADMIN]: { controlledBy: ACCESS_FUNCTIONS.MANAGEMENT_FUNCTION, desc: [] },
	[ACCESS_FUNCTIONS.CM]: { controlledBy: ACCESS_FUNCTIONS.MANAGEMENT_FUNCTION, desc: [] },
	[ACCESS_FUNCTIONS.CLIENT]: { controlledBy: ACCESS_FUNCTIONS.MANAGEMENT_FUNCTION, desc: [] },
	[ACCESS_FUNCTIONS.DEMO]: { controlledBy: ACCESS_FUNCTIONS.MANAGEMENT_FUNCTION, desc: [] },
	[ACCESS_FUNCTIONS.WEB_USER]: { controlledBy: ACCESS_FUNCTIONS.MANAGEMENT_FUNCTION, desc: [] },
};

// documentation
accessFunctionsObj[ACCESS_FUNCTIONS.ADMIN].desc = [
	"Big Boss of the System",
];

accessFunctionsObj[ACCESS_FUNCTIONS.CM].desc = [
	"Who can access the CM APIs",
];

for (const fun in accessFunctionsObj) {
	if (!accessFunctionsObj[fun].desc)
		accessFunctionsObj[fun].desc = [];
}


export const accessFunctions = {
	getAccessFunctions: function () {
		return accessFunctionsObj;
	}
};
