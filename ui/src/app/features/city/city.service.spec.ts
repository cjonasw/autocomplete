import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { Observable, forkJoin } from "rxjs";
import { environment } from "../../../environments/environment";
import { CityService } from "./city.service";

describe("CitiesService", () => {
  let service: CityService, httpTestingController: HttpTestingController;
  const allCitiesMockResponse = [
    "London",
    "New York",
    "Los Angeles",
    "Paris",
    "Berlin",
    "Tokyo",
    "Moscow",
    "Sydney",
    "Cape Town",
    "Rio de Janeiro",
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(CityService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // Standard usage of searchCities
  it("searchCities: should GET correct endpoint and return Observable<string[]> if query is not empty", (done: DoneFn) => {
    const search = "lon",
      mockResponse = ["London", "Long Beach", "Long Island"],
      $cities: Observable<string[]> = service.searchCities(search);

    // Check that the result is an observable with an array of strings
    $cities.subscribe((cities) => {
      expect(cities).toEqual(mockResponse);
      done();
    });

    // Check that the request was made with the correct URL
    const request = httpTestingController.expectOne(
      `${environment.apiUrl}/cities?search=${search}`
    );

    expect(request.request.method).toEqual("GET");
    request.flush(mockResponse);
    httpTestingController.verify();
  });

  // Empty string check
  it("searchCities: should return an empty array if query is empty", (done: DoneFn) => {
    const query = "",
      cities$: Observable<string[]> = service.searchCities(query);

    cities$.subscribe((cities) => {
      expect(cities).toEqual([]);
      done();
    });

    // Check no request is made regardless of URL
    httpTestingController.expectNone(() => true);
  });

  // Standard getAllCities usage
  it("getAllCities: should GET correct endpoint and return Observable<string[]>", (done: DoneFn) => {
    const cities$: Observable<string[]> = service.getAllCities();

    cities$.subscribe((cities) => {
      expect(cities).toEqual(allCitiesMockResponse);
      done();
    });

    const request = httpTestingController.expectOne(
      `${environment.apiUrl}/cities`
    );

    expect(request.request.method).toEqual("GET");

    request.flush(allCitiesMockResponse);

    httpTestingController.verify();
  });

  // Check caching
  it("getAllCities: should return a cached HTTP request", (done: DoneFn) => {
    const citiesA$: Observable<string[]> = service.getAllCities();
    const citiesB$: Observable<string[]> = service.getAllCities();

    forkJoin([citiesA$, citiesB$]).subscribe(([citiesA, citiesB]) => {
      expect(citiesA).toEqual(allCitiesMockResponse);
      expect(citiesB).toEqual(allCitiesMockResponse);
      done();
    });

    // Check only one request was made
    const request = httpTestingController.expectOne(
      `${environment.apiUrl}/cities`
    );
    expect(request.request.method).toEqual("GET");
    request.flush(allCitiesMockResponse);

    httpTestingController.verify();

    // Check that the two observables returned the same instance
    expect(citiesA$).toBe(citiesB$);
  });
});
