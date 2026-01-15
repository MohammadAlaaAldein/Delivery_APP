import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { objectsDiff } from 'src/common/utilities';
import { Repository } from 'typeorm';
import { ActionLog } from './entities/action-log.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { actions } from './dto/logActions';
import { UsersService } from '../users/users.service';
import * as _ from 'lodash';

@Injectable()
export class ActionLogService {
	constructor(
		@InjectRepository(ActionLog)
		private readonly actionLogsRepository: Repository<ActionLog>,
		private readonly userService: UsersService,
	) { }

	@OnEvent('action.log', { async: true })
	async handleActionLogEvent(payload: any) {
		const { req, ...options } = payload;
		await this.logAction(options, req);
	}

	async logAction(options, req) {
		options = options || {};
		req = req || { headers: {}, connection: {} };

		try {
			if (Object.keys(req).length == 0) {
				req = {
					'DEF-IPaddress': '127.0.0.1',
					'DEF-userAgent': 'server',
					'x-real-ip': ''
				};
			}

			let oldValuesTemp = options.old_values;
			let newValues = null;

			if (options.new_values && options.old_values) {
				newValues = objectsDiff(options.old_values, options.new_values);
				let newValueskeys = Object.keys(newValues);

				if (newValueskeys.length == 0 && !options.forceLog) {
					options.new_values = newValues;
					return;
				}

				options.old_values = {};
				newValueskeys.forEach(function (key) {
					options.old_values[key] = oldValuesTemp[key];
				});

				if (newValueskeys.length == 0 && options.forceLog) {
					Object.keys(oldValuesTemp).forEach(function (key) {
						if (oldValuesTemp[key] != options.new_values[key])
							options.old_values[key] = oldValuesTemp[key];
					});
				}
			}

			let actionUserID = options.action_user_id || 0;
			if (!actionUserID && req.user && !options.ignore_user)
				actionUserID = req.user.id;

			const userIP = req['DEF-IPaddress'] || req.headers?.['x-real-ip'] || req.connection?.remoteAddress || '';
			const userAgent = req['DEF-userAgent'] || req.headers?.['user-agent'] || '';
			options.new_values = newValues;

			const log = this.actionLogsRepository.create({
				old_values: options.old_values || {},
				new_values: newValues || {},
				action_name: options.action_name,
				related_id: options.related_id || '',
				additional_related_id: options.additional_related_id || '',
				action_user_id: actionUserID,
				ip_address: userIP,
				user_agent: userAgent,
				git_info: process.env.gitBranchInfo || '',
			});

			return await this.actionLogsRepository.save(log);
		} catch (ex) {
			throw ex;
		}
	}

	async getActionLogs(getActionLogDto) {
		const result = { data: [], totalDataCount: 0, overallItemsCount: 0 };

		const { current_page, limit, action_name, log_month, related_id, action_user_id, generic_id_search } = getActionLogDto;
		let startDate = null;
		let endDate = null;

		if (log_month) {
			const [year, month] = log_month.split('_').map(Number);
			startDate = new Date(year, month - 1, 1);
			endDate = new Date(year, month, 0, 23, 59, 59);
		}

		const query = this.actionLogsRepository.createQueryBuilder('action_logs');
		const countQuery = this.actionLogsRepository.createQueryBuilder('action_logs');
		if (startDate && endDate) {
			query.where(`action_logs.action_time >= :startDate AND action_logs.action_time <= :endDate`, { startDate, endDate });
			countQuery.where(`action_logs.action_time >= :startDate AND action_logs.action_time <= :endDate`, { startDate, endDate });
		}
		if (action_name) {
			query.andWhere(`action_logs.action_name = :action_name`, { action_name: action_name });
			countQuery.andWhere(`action_logs.action_name = :action_name`, { action_name: action_name });
		}
		if (related_id) {
			query.andWhere(`action_logs.related_id = :related_id`, { related_id: related_id });
			countQuery.andWhere(`action_logs.related_id = :related_id`, { related_id: related_id });
		}
		if (action_user_id) {
			query.andWhere(`action_logs.action_user_id = :action_user_id`, { action_user_id: action_user_id });
			countQuery.andWhere(`action_logs.action_user_id = :action_user_id`, { action_user_id: action_user_id });
		}
		if (generic_id_search) {
			const sqlValues = { equal_string: generic_id_search, match_string: "%" + generic_id_search + "%" }
			query.andWhere(`(action_logs.new_values::text LIKE :match_string OR action_logs.old_values::text LIKE :match_string OR action_logs.related_id = :equal_string OR action_logs.additional_related_id = :equal_string)`, sqlValues);
			countQuery.andWhere(`(action_logs.new_values::text LIKE :match_string OR action_logs.old_values::text LIKE :match_string OR action_logs.related_id = :equal_string OR action_logs.additional_related_id = :equal_string)`, sqlValues);
		}


		query.orderBy('action_logs.action_time', 'DESC').skip((current_page - 1) * limit).take(limit);
		const data = await query.getMany();
		result.data = await this.formatActionLogs(data);

		result.totalDataCount = await countQuery.getCount();
		result.overallItemsCount = await this.actionLogsRepository.count();

		return result;
	}

	async formatActionLogs(logs) {
		let items = { device: [], note: [], user: [] };
		let itemsData = { device: {}, note: {}, user: {} };
		for (let row of logs) {
			let logTypeInfo = actions[row.action_name] || { type: 'device' };

			//Actions that can be of type device (multiple related_id formats)
			let actionType = (logTypeInfo.deviceType && isNaN(row.related_id)) ? 'device' : logTypeInfo.type;

			if (row.action_user_id && items.user.indexOf(row.action_user_id) < 0)
				items.user.push(row.action_user_id);
			if (row.related_id && items[actionType].indexOf(row.related_id) < 0)
				items[actionType].push(row.related_id);
			if (row.additional_related_id && row.additional_related_id != '{}' && items[logTypeInfo.additionalRelatedID].indexOf(row.additional_related_id) < 0)
				items[logTypeInfo.additionalRelatedID].push(row.additional_related_id);
		}
		for (let item in items) {
			if (!items[item].length)
				continue;
			let itemInfo;
			switch (item) {
				case 'user':
					itemInfo = await this.userService.getUsersInfo(items[item], { selectColumns: 'id, name' });
					itemsData[item] = _.chain(itemInfo).map((el) => {
						return { id: el.id, name: el.name };
					}).keyBy('id').value();
					break;
			}
		}
		logs.forEach((log) => {
			let logTypeInfo = actions[log.action_name] || { type: 'device' };

			//Actions that can be of type device (multiple related_id formats)
			let actionType = (logTypeInfo.deviceType && isNaN(log.related_id)) ? 'device' : logTypeInfo.type;

			if (itemsData[actionType][log.related_id])
				log.related_id += ' - ' + itemsData[actionType][log.related_id].name;
			if (logTypeInfo.additionalRelatedID && itemsData[logTypeInfo.additionalRelatedID][log.additional_related_id])
				log.additional_related_id += ' - ' + itemsData[logTypeInfo.additionalRelatedID][log.additional_related_id].name;
			if (itemsData.user[log.action_user_id])
				log.action_user_id += ' - ' + itemsData.user[log.action_user_id].name;
		});
		return logs;
	}
}
