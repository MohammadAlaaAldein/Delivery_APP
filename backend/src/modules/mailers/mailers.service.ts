import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { getSiteBaseURL, IsDev, IsStaging } from 'src/common/constants';
import moment from 'moment';
import { join } from 'path';
import { Repository } from 'typeorm';
import { Mailer } from './entities/mailer.entity';
import { InjectRepository } from '@nestjs/typeorm';

interface SCTEmail {
	bcc?: string[] | string, from?: string;
	to?: string;
	subject?: string;
	text?: string;
	attachments?: any[];
	html?: string;
	cc?: string | string[];
	template?: string;
	context?: any;
	forceRecipient?: boolean;
}

@Injectable()
export class MailersService {
	defaults = {
		from: '"Delivery APP" mohammad.aladin996@gmail.com',
		subject: 'NO SUBJECT FOUND!',
		to: process.env.DEFAULT_EMAIL_RECIPIENT
	};
	renderedHTML = '';

	constructor(
		@InjectRepository(Mailer)
		private readonly mailerRepository: Repository<Mailer>,
		private readonly mailerService: MailerService,
	) {
		if (IsDev())
			this.defaults.from = '"Delivery APP" mohammad.aladin996@gmail.com';
	}

	async sendMailTemplate(path: string, viewParams: any, envelope: SCTEmail = {}) {
		let originalEmail: string;
		if (IsDev() || IsStaging())
			originalEmail = envelope.to || this.defaults.to;

		envelope = this.prepareEmail(envelope);
		const context = {
			data: viewParams,
			path: join(__dirname, '..', '..', '..', 'view', 'emails', ...path.split('/')),
			websiteUrl: getSiteBaseURL(),
			year: moment().year(),
			originalEmail,
			text: envelope.text
		};

		delete envelope.text;

		await this.mailerService.sendMail({
			...envelope,
			template: join(__dirname, '..', '..', '..', 'view', 'emails', 'index'),
			context
		});
		await this.logDispatchedEmails(envelope);
	}

	private async sendMail(email: SCTEmail) {
		const envelope: SCTEmail = this.prepareEmail(email);
		if (this.renderedHTML.length > 0) {
			email.html = "<input type='hidden' name='" + moment().format('X') + "' value='" + process.env.SERVER + "'/>" + this.renderedHTML;
			envelope.html = this.renderedHTML;
		}

		let originalEmail;
		if (IsDev() || IsStaging()) {
			originalEmail = envelope.to;
		}

		if (email.html) {
			envelope.html = `
				<!DOCTYPE html>
				<html lang='en-US'>
					<head>
						<meta http-equiv='Content-Type' content='text/html; charset=utf-8' />
					</head>
					<body>
						<input type='hidden' name='${moment().format('X')}' value='${process.env.SERVER}'/>
						${originalEmail ? `<p>Original target email address is: <b>${originalEmail}</b></p><br/>` : ''}
						${envelope.text ? `<p>${envelope.text}</p><br/>` : ''}
						${email.html}
					</body>
				</html>`;
		}

		delete envelope.text;

		await this.mailerService.sendMail(envelope);
		await this.logDispatchedEmails(envelope);
	}

	private prepareEmail(email: SCTEmail): SCTEmail {
		email.bcc = email.bcc || '';

		if (Array.isArray(email.bcc))
			email.bcc = email.bcc.join(';');

		const envelope: SCTEmail = {
			from: email.from || this.defaults.from,
			to: email.to || this.defaults.to,
			subject: email.subject || this.defaults.subject,
			text: email.text,
			bcc: email.bcc
		};

		if (email.attachments) {
			envelope.attachments = email.attachments;
		}

		if (IsDev()) {
			if (!email.forceRecipient)
				envelope.to = this.defaults.to;

			envelope.bcc = '';
			envelope.from = '"Delivery APP" mohammad.aladin996@gmail.com';
		} else if (IsStaging()) {
			envelope.from = '"Delivery APP" mohammad.aladin996@gmail.com';
			email.subject = "Testing:" + email.subject;
			envelope.bcc = '';

			if (!email.forceRecipient)
				envelope.to = this.defaults.to;
		}

		const override = process.env.OVERRIDE_EMAIL_RECIPIENT;
		if (override && !email.forceRecipient)
			envelope.to = override;

		return envelope;
	}

	private async logDispatchedEmails(envelope: SCTEmail) {
		const email = {
			sender: envelope.from,
			receiver: envelope.to,
			subject: envelope.subject,
			body: envelope.html || envelope.text,
			server_name: process.env.SERVER
		};

		const log = this.mailerRepository.create(email);
		return await this.mailerRepository.save(log);
	}
}
