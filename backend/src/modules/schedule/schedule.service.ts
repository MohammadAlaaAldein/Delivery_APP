import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { arrayToAssociativeArray, sleep } from 'src/common/utilities';
import { getServerPrettyName, IsProd, IsStaging } from 'src/common/constants';
import moment from 'moment';
import * as Sentry from "@sentry/nestjs";
import { CronJob } from 'cron';

@Injectable()
export class ScheduleService {

	allSchedNames: string[] = [];
	readonly SCHED_QUEUE_KEY = 'sched_queue';
	readonly RUN_SCHED_ON_DEMAND_KEY = 'run_sched_on_demand';

	readonly schedServices = {
		SCHED_SERVICE: 'SCHED_SERVICE',
	};

	constructor(
		private redisService: RedisService,
	) { }

	async manageSched() {
		try {
			this.redisService.hdel(this.getCronJobsInfoHashKey(), 'ALL');

			try {
				let monitorScheduledFunctionsCacheKey = 'monitor_scheduled_functions';
				monitorScheduledFunctionsCacheKey += getServerPrettyName().split(' ').join('-');

				await this.redisService.del([monitorScheduledFunctionsCacheKey]);

				this.manageSchedFunctions();

				this.cleanSchedCache(this.getCronJobsInfoHashKey(), this.allSchedNames);
			} catch (ex) {
				throw ex;
			}
		} catch (ex) {
			throw ex;
		}
	}

	async getCronJobsStatus() {
		try {
			const toReturn = [];

			for (const server of ['local', 'STAGING', 'dev', 'delivery_app']) {
				const hashKey = this.getCronJobsInfoHashKey(server);
				const result = await this.redisService.hgetall(hashKey);

				for (const name in result) {
					const temp = JSON.parse(result[name]);
					temp.name = name;
					temp.server = server;
					toReturn.push(temp);
				}
			}

			return toReturn;
		} catch (ex) {
			throw ex;
		}
	}

	async getSchedFunctionsStatus() {
		try {
			const returnList = {};
			const cronJobs = await this.getCronJobsStatus();

			for (const cron of cronJobs) {

				cron.prettyName = cron.name;

				if (!returnList[cron.server])
					returnList[cron.server] = [];

				returnList[cron.server].push({ name: cron.name, prettyName: cron.prettyName, server: cron.server, is_active: !cron.disabled });
			}

			for (const server in returnList)
				returnList[server].sort((a, b) => { return (a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1); });

			return returnList;
		} catch (ex) {
			throw ex;
		}
	}

	private getCronJobsInfoHashKey(server?: string) {
		let hashKey = 'Cron-Jobs-Info-Hash';

		if (server)
			hashKey += ('-' + server);
		else
			hashKey += ('-' + process.env.SERVER_PRETTY_NAME.split(' ').join('-'));

		return hashKey;
	}

	async updateSchedFunctionsStatus(schedulesStatus) {
		try {
			const schedulesStatusObj = {};

			for (const server in schedulesStatus) {
				schedulesStatusObj[server] = arrayToAssociativeArray(schedulesStatus[server], 'name');
			}

			const cronJobs = await this.getCronJobsStatus();

			for (const cron of cronJobs) {

				const hashKey = this.getCronJobsInfoHashKey(cron.server);
				if (schedulesStatusObj[cron.server] && schedulesStatusObj[cron.server][cron.name])
					cron.disabled = !schedulesStatusObj[cron.server][cron.name].is_active;

				await this.redisService.hset(hashKey, [cron.name], [cron]);

				// TODO: Add a log entry
			}
		} catch (ex) {
			throw ex;
		}
	}

	async addSchedToRun(sched: any) {
		try {
			const schedWaited = (await this.redisService.get(this.RUN_SCHED_ON_DEMAND_KEY, 0, true)) || [];
			schedWaited.push(sched);
			await this.redisService.set(this.RUN_SCHED_ON_DEMAND_KEY, schedWaited, 24 * 60 * 60, true);
			return {};
		} catch (ex) {
			throw ex;
		}
	}

	private async monitorScheduledFunctions(name: string, action: string) {
		let monitorScheduledFunctionsCacheKey = 'monitor_scheduled_functions'
		monitorScheduledFunctionsCacheKey += getServerPrettyName().split(' ').join('-');

		switch (action) {
			case 'Running':
				const nowTime = moment().utc().unix();
				await this.redisService.hset(monitorScheduledFunctionsCacheKey, [name], [nowTime]);
				return;
			case 'On Hold':
				await this.redisService.hdel(monitorScheduledFunctionsCacheKey, name);
				return;
		}
	}

	private async cleanSchedCache(hashKey: string, function_names: string | string[]) {
		const result = await this.redisService.hgetall(hashKey);

		const toBeDeleted = [];
		for (const name in result) {
			if (function_names.indexOf(name) == -1) // get all hash fields that's NOT scheduled after restart.
				toBeDeleted.push(name);
		}

		for (const field of toBeDeleted) { // delete NOT scheduled functions from hash.
			await this.redisService.hdel(hashKey, field);
		}

		// Add 'ALL' hash field to control all sched on one server.
		await this.redisService.hset(hashKey, ['ALL'], [JSON.stringify({ disabled: false })]);
		return;
	}

	private async runSchedOnDemand() {
		try {
			let schedWaited = (await this.redisService.get(this.RUN_SCHED_ON_DEMAND_KEY, 0, true)) || [];

			for (const sched of schedWaited) {
				let service;

				switch (sched.service) {
					case this.schedServices.SCHED_SERVICE:
						service = this;
						break;
					default:
						service = this[sched.service];
						break;
				}

				try {
					console.info('runSchedOnDemand running', sched.name);
					await service[sched.name]();
					console.info('runSchedOnDemand done', sched.name);
				} catch (ex) {
					console.log('runSchedOnDemand failed', sched.name);
				}

				schedWaited = schedWaited.filter(f => f.name != sched.name);
			}

			await this.redisService.set(this.RUN_SCHED_ON_DEMAND_KEY, schedWaited, 24 * 60 * 60, true);
			return {};
		} catch (ex) {
			throw ex;
		}
	}

	private async scheduleFunction(time: string, onTickFunction, options, onCompleteFunction = async () => { }) {
		try {
			if (time === undefined || onTickFunction === undefined) {
				console.error('Wrong call of scheduleFunction!');
				return;
			}

			const cronJobsInfoHashKey = this.getCronJobsInfoHashKey();

			options = options || {};

			const start = options.start || false,
				once = options.isOnce || false,
				name = options.name,
				service = options.service,
				mutexEnabled = true;

			let mutexKey = options.mutexKey || null,
				frequency = options.frequency || null,
				logEnabled = true;

			if (!mutexKey || 0 == mutexKey.length) {
				console.log("Explicit Mutex addition to " + name);
				mutexKey = name + "_MUTEX";
			}
			mutexKey += process.env.schedVersion;

			if (IsStaging())
				mutexKey += '_staging';

			if (options.disableLog)
				logEnabled = false;

			if (typeof name != 'string' || name.length === 0) {
				console.error('Unknown function name has been scheduled!');
				return;
			}

			this.allSchedNames.push(name);

			const updateCronJobsHash = async (name: string, mode: string): Promise<{ err: string | null; res: any }> => {
				if (once || name == 'checkCronJobsHash')
					return { err: null, res: null };

				const frequencyTemp = frequency || 'everySecs';

				const freqSec: { [key: string]: number } = {
					everySecs: 1,
					everyMins: 60,
					everyHours: 3600
				};

				const frequencyInSec = freqSec[frequencyTemp] ? freqSec[frequencyTemp] * Number(time) : 0;
				let timeDiff = frequencyInSec;

				if (!frequencyInSec) {
					const splitted = (time as string).split(':');

					if (frequency == 'daily') {
						timeDiff = moment().utc().hours(Number(splitted[0])).minutes(Number(splitted[1])).seconds(0).unix() - moment().utc().unix();
						timeDiff = timeDiff <= 0 ? timeDiff + 24 * 60 * 60 : timeDiff;
					} else if (frequency == 'weekly') {
						timeDiff = moment().utc().days(Number(splitted[0])).hours(Number(splitted[1])).minutes(Number(splitted[2])).seconds(0).unix() - moment().utc().unix();
						timeDiff = timeDiff <= 0 ? timeDiff + 7 * 24 * 60 * 60 : timeDiff;
					} else if (frequency == 'monthly') {
						timeDiff = moment().utc().date(Number(splitted[0])).hours(Number(splitted[1])).minutes(Number(splitted[2])).seconds(0).unix() - moment().utc().unix();
						timeDiff = timeDiff <= 0 ? moment().utc().add(1, 'months').date(Number(splitted[0])).hours(Number(splitted[1])).minutes(Number(splitted[2])).seconds(0).unix() - moment().utc().unix() : timeDiff;
					}
				}

				const nextCallTime = moment().utc().unix() + timeDiff;

				if (mode == 'schedule') {
					const value = {
						lastCallTime: 0,
						frequency: frequencyTemp,
						frequencyInSec: frequencyInSec,
						nextCallTime: nextCallTime,
						time: time,
						runningStatus: 'Initialized',
						disabled: false,
						service,
					};
					await this.redisService.hset(cronJobsInfoHashKey, [name], [value], 6 * 30 * 24 * 60 * 60);
				} else {
					//mode == 'Running' || mode == 'On Hold'
					const result: any = await this.redisService.hget(cronJobsInfoHashKey, name, 0, true);
					if (!result) {
						console.error('updateCronJobsHash: Invalid scheduled function name', name);
						return { err: 'invalid_scheduled_function_name', res: name };
					}
					result.lastCallTime = moment().utc().unix();
					result.nextCallTime = nextCallTime;
					result.runningStatus = mode;

					await this.redisService.hset(cronJobsInfoHashKey, [name], [result]);
					await this.monitorScheduledFunctions(name, mode);
					return { err: null, res: null };
				}
			};

			const mutexLock = async (mutexEnabled: boolean, mutexKey: string, name: string): Promise<{ err: string | null; res: any }> => {
				if (!mutexEnabled)
					return { err: null, res: null };

				const infoKey = this.getCronJobsInfoHashKey();
				const res = await this.redisService.hgetall(infoKey);

				let schedStopped = '';
				let allSchedsStopped = '';
				if (res[name])
					schedStopped = JSON.parse(res[name]).disabled;

				if (res.ALL)
					allSchedsStopped = JSON.parse(res.ALL).disabled;

				if (schedStopped || allSchedsStopped) {
					console.info(name + " scheduling is STOPPED");
					return { err: 'stop', res: null };
				}

				const mutexStatus = await this.redisService.get(mutexKey);

				await updateCronJobsHash(name, 'Running');

				if (mutexStatus != null)
					return { err: 'locked', res: null };

				const lockKey = Math.random().toString(36).substring(7);

				await this.redisService.set(`${mutexKey}`, lockKey, 60 * 60 * 1, false);

				await sleep(20);

				const getCachedLockValue = await this.redisService.get(mutexKey);
				if (getCachedLockValue != lockKey)
					return { err: 'locked', res: null };

				return { err: null, res: null };
			};

			const mutexUnLock = async (mutexEnabled: boolean, mutexKey: string, mode: string): Promise<void> => {
				if (!mutexEnabled)
					return;

				await this.redisService.del([mutexKey]);
				await updateCronJobsHash(name, mode);
				return;
			};

			let cronTime = '*/' + time + ' * * * * *';
			let parsedTime: string[];
			if (once) {
				const now = new Date(new Date().getTime() + 10000 + 1000 * Number(time));
				parsedTime = (time as string).split(':');
				cronTime = now.getSeconds() + ' ' + now.getMinutes() + ' ' + now.getHours() + ' ' + now.getDate() + ' ' + now.getMonth() + ' *';
				frequency = "";
			}
			switch (frequency) {
				case 'everyMins':
					cronTime = Math.floor(Math.random() * 59) + ' */' + time + ' * * * *';
					break;
				case 'everyHours':
					cronTime = Math.floor(Math.random() * 59) + " " + Math.floor(Math.random() * 59) + ' */' + time + ' * * *';
					break;
				case 'daily':
					parsedTime = (time as string).split(':');
					cronTime = '0 ' + parsedTime[1] + ' ' + parsedTime[0] + ' * * *';
					break;
				case 'weekly':
					parsedTime = (time as string).split(':');
					cronTime = '0 ' + parsedTime[2] + ' ' + parsedTime[1] + ' * * ' + parsedTime[0];
					break;
				case 'monthly':
					parsedTime = (time as string).split(':');
					cronTime = '0 ' + parsedTime[2] + ' ' + parsedTime[1] + ' ' + parsedTime[0] + ' * *';
					break;
			}
			console.info("scheduling " + name + " With Cron: " + cronTime);

			await mutexUnLock(mutexEnabled, mutexKey, 'schedule');

			const cronJob = new CronJob(cronTime, async () => {
				try {
					const mutexStatus = await mutexLock(mutexEnabled, mutexKey, name);
					const err = mutexStatus.err;

					if (err == 'stop')
						return;

					if (logEnabled)
						console.info('Running Scheduled Function ' + name);

					if (!err)
						await onTickFunction();

					await mutexUnLock(mutexEnabled && err !== 'locked', mutexKey, 'On Hold');

					if (logEnabled)
						console.info('Done Scheduled Function ' + name);

					if (once)
						cronJob.stop();

					const normalErrors = ['locked'];
					if (err && normalErrors.indexOf(err) === -1) {
						Sentry.captureEvent({
							message: `[SCHED]${err}`,
							extra: {
								mainCaller: 'schedule',
								functionName: name,
								is_sched: true,
								error: err
							}
						});
					}
				} catch (ex) {
					Sentry.captureEvent({
						message: `[SCHED]${ex.message}`,
						extra: ex
					});

					await mutexUnLock(mutexEnabled, mutexKey, 'On Hold');
					if (logEnabled)
						console.info('Done Scheduled Function ' + name);

					if (once)
						cronJob.stop();
				}
			}, async () => {
				console.info('Done Scheduled Function ' + name);
				await onCompleteFunction();
			}, start);
		} catch (ex) {
			Sentry.captureEvent({
				message: `[SCHED]${ex.message}`,
				extra: ex
			});
		}
	}

	private manageSchedFunctions() {
		// this.scheduleFunction('10',
		// 	async () => {
		// 		await this.service.functionName();
		// 	},
		// 	{
		// 		start: true | false,
		// 		isOnce: false,
		// 		frequency: 'everyMins',
		// 		name: 'functionName',
		// 		mutexKey: 'functionName',
		// 	}
		// );

		if (!IsProd()) {
			this.scheduleFunction('10',
				async () => {
					await this.runSchedOnDemand();
				},
				{
					start: true,
					isOnce: false,
					name: 'runSchedOnDemand',
					mutexKey: 'runSchedOnDemand'
				}
			);
		}
	}
}
