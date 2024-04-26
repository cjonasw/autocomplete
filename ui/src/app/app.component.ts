import { AsyncPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  WritableSignal,
  signal,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterOutlet } from "@angular/router";
import { Subscription, first } from "rxjs";
import { AutocompleteComponent } from "./features/autocomplete/autocomplete.component";
import { CityService } from "./features/city/city.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterOutlet,
    AutocompleteComponent,
    ReactiveFormsModule,
    AsyncPipe,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  // Client side implementation
  cityA: string = "";
  searchedCitiesA: WritableSignal<string[]> = signal<string[]>([]);
  allCities!: string[]; // Not used in template

  // Server side implementation
  cityB: string = "";
  searchedCitiesB: WritableSignal<string[]> = signal<string[]>([]);

  // Subscription to cancel the search request
  citySearch$!: Subscription;

  /**
   * Client side implementation
   */
  autoCompleteSearchA(searchTerm: string) {
    console.log("searchTerm", searchTerm);
    // Filter the cities based on the search term
    // Could share this logic with the server side implementation to be consistent if we wanted both to behave the same
    this.searchedCitiesA.set(
      searchTerm
        ? this.allCities
            .filter((city) =>
              city.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort(
              (a, b) =>
                a.toLowerCase().indexOf(searchTerm.toLowerCase()) -
                b.toLowerCase().indexOf(searchTerm.toLowerCase())
            )
        : []
    );
  }

  citiesASelected(city: string) {
    console.log("city A", city);
  }

  /**
   * Server side implementation
   */

  autoCompleteSearchB(searchTerm: string) {
    console.log("searchTerm", searchTerm);
    // Cancel any existing search request
    this.citySearch$?.unsubscribe();

    this.citySearch$ = this.cityService
      .searchCities(searchTerm)
      .pipe(first())
      .subscribe({
        next: (cities: string[]) => {
          this.searchedCitiesB.set(cities);
        },
      });
  }

  citiesBSelected(city: string) {
    console.log("city B", city);
  }

  constructor(private cityService: CityService) {}

  ngOnInit() {
    // Just for the client filtering example
    this.cityService
      .getAllCities()
      .pipe(first())
      .subscribe((cities) => {
        this.allCities = cities;
      });
  }

  // Demo

  disabled = signal<boolean>(false);
  disableToggle() {
    this.disabled.update((disabled) => !disabled);
  }
}
