import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of, shareReplay } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class CityService {
  constructor(private http: HttpClient) {}

  // Notes:
  // Cities could also provide other information I can weight my suggestions on.
  // Currently it's hard to provide useful suggestions because the API only returns city names.

  // Considered:
  // Caching - but thought it wouldn't help the UX or performance due to the results being searched.
  //
  searchCities(query: string): Observable<string[]> {
    // Don't allow empty queries or " " queries, return empty array
    if (!query || query.trim() === "") {
      return of([]);
    }

    // Return empty array if query is empty
    return this.http.get<string[]>(
      `${environment.apiUrl}/cities?search=${query}`
    );
  }

  private $cities?: Observable<string[]>;
  getAllCities(): Observable<string[]> {
    if (!this.$cities) {
      this.$cities = this.http
        .get<string[]>(`${environment.apiUrl}/cities`)
        .pipe(shareReplay(1)); // Cache this since it's a static list
    }
    return this.$cities;
  }
}
