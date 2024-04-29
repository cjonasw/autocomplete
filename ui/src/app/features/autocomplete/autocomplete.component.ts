import { AsyncPipe, CommonModule, NgClass, SlicePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  WritableSignal,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { debounceTime } from "rxjs";
import { Key } from "ts-key-enum";

/**
 * Considered:
 * Using ModelSignals and InputSignals but only in developer preview so decided not to use it (new in Angular 17)
 */

/**
 * Due to the amount of interactions here, I would have liked to separate this out into smaller components for
 * better readability and maintainability - Probably the input and the true autocomplete stuff.
 */
@Component({
  selector: "app-autocomplete",
  standalone: true,
  imports: [AsyncPipe, SlicePipe, ReactiveFormsModule, NgClass, CommonModule],
  templateUrl: "./autocomplete.component.html",
  styleUrl: "./autocomplete.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteComponent implements OnInit {
  /**
   * Settings
   */
  @Input() debounceTime: number = 100;
  @Input() resultLimit: number = 10;

  /**
   * Disables the search input.
   */
  _disabled: WritableSignal<boolean> = signal<boolean>(false);
  @Input() set disabled(value: boolean) {
    this._disabled.set(value);

    if (this.searchControl) {
      if (this._disabled()) {
        this.searchControl.disable({
          emitEvent: false,
        });
      } else {
        this.searchControl.enable({
          emitEvent: false,
        });
      }
    }
  }

  /**
   * Two-way binding for value
   * Changes emitted for searchChanges and optionSelected consolidated (doesn't fire twice)
   * This is so the parent component can handle each event separately.
   *
   * Gives the ability to use the component as a freetext input or with predefined options.
   * If we only wanted predefined options, we could just hook into the optionSelected event.
   */
  @Input() value: string = "";
  @Output() valueChange = new EventEmitter<string>();

  /**
   * The options to display in the autocomplete.
   */
  @Input() options!: string[];

  /**
   * Option elements
   */
  @ViewChildren("optionElement") optionElement!: QueryList<ElementRef>;

  /**
   * Attributes for the search input
   */
  @Input() inputId: string = "";
  @Input() inputName: string = "";
  @Input() inputPlaceholder: string = "";

  /**
   * Emits the search term when the user stops typing.
   * The search term is used to filter the options outside of the component.
   */
  @Output() searchChanges = new EventEmitter<string>();

  /**
   * Used to emit the selected option. Component usage could be a combination
   * of freetext value changes and predefined options, but most likely predefined options.
   */
  @Output() optionSelected = new EventEmitter<string>();

  /**
   * The form control for the search input.
   */
  searchControl!: FormControl; // = new FormControl();

  @ViewChild("searchInput") searchInput!: HTMLInputElement;

  private dropdownActive: boolean = false;

  // TODO: Should change to signal
  // Used in template, keep it light
  get isActive(): boolean {
    return (
      // Hides dropdown when there are no options
      this.options?.length > 0 &&
      // Hides dropdown instantly when search input is empty
      this.searchControl?.value?.length > 0 &&
      this.dropdownActive
    );
  }

  @HostListener("document:click", ["$event"])
  documentClick(event: MouseEvent) {
    // Check if the click was outside the component by checking if the target is not a child of the component
    // Considered: using input blur but it hides the dropdown before the click event is triggered
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownActive = false;
    }
  }

  constructor(
    private elementRef: ElementRef,
    @Inject(DestroyRef) private destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.searchControl = new FormControl({
      value: this.value,
      disabled: this.disabled,
    });

    /**
     * Emit the search term based on the value of the search input.
     */

    this.searchControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(this.debounceTime)
      )
      .subscribe((value) => {
        // Open dropdown and emit events when typing but not immediately after selecting an option
        if (!this.selectedOption) {
          this.dropdownActive = true;
          this.searchChanges.emit(value);
          this.valueChange.emit(value);
        }

        this.selectedOption = false;
      });
  }

  /**
   * Selects an option and sets it as the search value and closes the dropdown.
   */
  selectedOption = false;
  selectOption(option: string) {
    this.searchControl.setValue(option);
    this.dropdownActive = false;
    this.optionSelected.emit(option);
    this.valueChange.emit(option);
    this.selectedOption = true;
    this.highlightedIndex.set(0);
  }

  /**
   * Focuses the search input and opens the dropdown.
   */
  onSearchFocus() {
    this.dropdownActive = true;
  }

  /**
   * Keyboard Events
   */

  /**
   * The index of the highlighted option.
   * This is used to highlight the option when navigating with the keyboard.
   */
  highlightedIndex: WritableSignal<number> = signal<number>(0);

  /**
   * Handle keyboard events via the search input.
   */
  onSearchKeydown(event: KeyboardEvent) {
    const key = event.key;

    switch (key) {
      case Key.Enter:
        event.preventDefault();
        this.selectOption(this.options[this.highlightedIndex()]);
        break;
      case Key.Escape:
        this.dropdownActive = false;
        break;
      case Key.ArrowDown:
        this.moveHighlight(1);
        this.dropdownActive = true;
        break;
      case Key.ArrowUp:
        this.moveHighlight(-1);

        break;
    }
  }

  /**
   * Moves the highlighted index by the given amount.
   */
  moveHighlight(amount: number) {
    this.highlightedIndex.update((index) => {
      const newIndex = index + amount,
        maxIndex = Math.min(this.options.length, this.resultLimit) - 1;
      return Math.min(Math.max(newIndex, 0), maxIndex);
    });

    this.scrollCurrentOptionIntoView();
  }

  /**
   * Scrolls the highlighted option into view.
   */
  scrollCurrentOptionIntoView() {
    const highlightedElement: ElementRef =
      this.optionElement.toArray()[this.highlightedIndex()];

    if (highlightedElement) {
      highlightedElement.nativeElement.scrollIntoView({
        block: "nearest",
      });
    }
  }
}
