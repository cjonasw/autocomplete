import { TestBed } from "@angular/core/testing";

import { CityService } from "./city.service";

describe("CitiesService", () => {
  let service: CityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CityService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // test that searchCities() returns a HTTP request if query is not empty
  it("should return a HTTP request if query is not empty", () => {
    const query = "test";
    const result = service.searchCities(query);
    expect(result).toBeTruthy();
  });
});
