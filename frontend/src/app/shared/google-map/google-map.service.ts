import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class GoogleMapService {
	private currentApiStatus: BehaviorSubject<Boolean>;
	obsCurrentApiStatus: Observable<Boolean>;

	constructor(private httpClient: HttpClient) {
		this.init();
	}

	init() {
		this.currentApiStatus = new BehaviorSubject(new Boolean(false));
		this.obsCurrentApiStatus = this.currentApiStatus.asObservable();
		this.httpClient
			.jsonp('https://maps.googleapis.com/maps/api/js?key=AIzaSyCUP3iPHIhlYArHvgld4WXoun6XJrsyLRM&libraries=places', 'callback')
			.pipe(
				map(() => true),
				catchError(() => of(false))
			)
			.subscribe((loaded) => {
				this.currentApiStatus.next(loaded);
			});
	}
}
