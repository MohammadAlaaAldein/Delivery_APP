import { HttpException, HttpStatus } from "@nestjs/common"
import { translate } from "./utilities";

export enum ErrorKeys {
	UNIQUE_VIOLATION_EMAIL = 'unique_violation_email',
	NEW_PASSWORD_SAME_AS_OLD_PASSWORD = 'new_password_same_as_old_password',
	NEW_PASSWORD_AND_CONFIRMED_PASSWORD_NOT_MATCHED = 'new_password_and_confirmed_password_not_matched',
	INVALID_USER = 'invalid_user',
	INCORRECT_OLD_PASSWORD = 'incorrect_old_password',
	INVALID_CAPTCHA = 'invalid_captcha',
	RESET_PASSWORD_LINK_EXPIRED = 'invalid_reset_password_link',
	UNIQUE_VIOLATION_NAME = 'unique_violation_name',
	NO_CHANGES = 'no_changes',
}

const errorMap = {
	users: {
		[ErrorKeys.UNIQUE_VIOLATION_EMAIL]: {
			status: HttpStatus.CONFLICT,
			message: translate('users.email_is_already_in_use'),
			error: 'Conflict'
		},
		[ErrorKeys.NEW_PASSWORD_SAME_AS_OLD_PASSWORD]: {
			status: HttpStatus.BAD_REQUEST,
			message: translate('users.new_password_cannot_be_the_same_as_the_old_password'),
			error: 'Bad Request'
		},
		[ErrorKeys.NEW_PASSWORD_AND_CONFIRMED_PASSWORD_NOT_MATCHED]: {
			status: HttpStatus.BAD_REQUEST,
			message: translate('users.new_password_and_confirm_password_do_not_match'),
			error: 'Bad Request'
		},
		[ErrorKeys.INVALID_USER]: {
			status: HttpStatus.BAD_REQUEST,
			message: translate('users.user_not_found'),
			error: 'Bad Request'
		},
		[ErrorKeys.INCORRECT_OLD_PASSWORD]: {
			status: HttpStatus.BAD_REQUEST,
			message: translate('users.old_password_is_incorrect'),
			error: 'Bad Request'
		},
		[ErrorKeys.INVALID_CAPTCHA]: {
			status: HttpStatus.BAD_REQUEST,
			message: translate('g.invalid_captcha'),
			error: 'Bad Request'
		},
		[ErrorKeys.RESET_PASSWORD_LINK_EXPIRED]: {
			status: HttpStatus.NOT_FOUND,
			message: translate('users.invalid_reset_password_link'),
			error: 'Bad Request'
		},
		[ErrorKeys.NO_CHANGES]: {
			status: HttpStatus.UNPROCESSABLE_ENTITY,
			message: translate('g.no_changes_applied'),
			error: 'Bad Request'
		},
	},
	shops: {
		[ErrorKeys.UNIQUE_VIOLATION_NAME]: {
			status: HttpStatus.CONFLICT,
			message: translate('shops.name_is_already_in_use'),
			error: 'Conflict'
		},
		[ErrorKeys.NO_CHANGES]: {
			status: HttpStatus.UNPROCESSABLE_ENTITY,
			message: translate('g.no_changes_applied'),
			error: 'Bad Request'
		},
	},
	companies: {
		[ErrorKeys.UNIQUE_VIOLATION_NAME]: {
			status: HttpStatus.CONFLICT,
			message: translate('companies.name_is_already_in_use'),
			error: 'Conflict'
		},
		[ErrorKeys.NO_CHANGES]: {
			status: HttpStatus.UNPROCESSABLE_ENTITY,
			message: translate('g.no_changes_applied'),
			error: 'Bad Request'
		},
	},
};

export const handleThrowApiError = (module: string, errorKey: string) => {
	const moduleErrors = errorMap[module];

	if (!moduleErrors) {
		throw new HttpException(
			{
				statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
				message: 'Module not found',
				error: 'Internal Server Error',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}

	const error = moduleErrors[errorKey];
	if (!error) {
		throw new HttpException(
			{
				statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
				message: 'Unhandled error',
				error: 'Internal Server Error',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}

	throw new HttpException(
		{
			statusCode: error.status,
			message: error.message,
			error: error.error,
		},
		error.status,
	);
};

export const handleSuccessApiResponse = (options: { message?: string, data?: any }) => {
	const response: { statusCode: number, message?: string, data?: String[] } = {
		statusCode: HttpStatus.OK,
	}

	if (options.message)
		response.message = options.message;

	if (options.data)
		response.data = options.data;

	return response
};