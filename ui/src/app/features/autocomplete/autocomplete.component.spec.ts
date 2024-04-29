import { ChangeDetectorRef } from "@angular/core";
import { RenderResult, render } from "@testing-library/angular";
import { AutocompleteComponent } from "./autocomplete.component";

describe("AutocompleteComponent", () => {
  let component: RenderResult<AutocompleteComponent>;
  let componentInstance: AutocompleteComponent;
  let textbox: HTMLElement;
  let changeDetection: ChangeDetectorRef;

  beforeEach(async () => {
    component = await render(AutocompleteComponent);
    componentInstance = component.fixture.componentInstance;
    textbox = component.getByRole("textbox");
    changeDetection =
      component.fixture.componentRef.injector.get(ChangeDetectorRef);
  });

  it("should render an input", async () => {
    expect(textbox).toBeTruthy();
  });

  /**
   * Search input
   */
  it("@Output() searchChanges: should emit when the input is changed manually", (done: DoneFn) => {
    // @Output
    componentInstance.searchChanges.subscribe((value) => {
      expect(value).toBe("tes");
      done();
    });

    componentInstance.searchControl.setValue("t");
    componentInstance.searchControl.setValue("te");
    componentInstance.searchControl.setValue("tes"); // Should be the only value emitted
  });

  /**
   *
   * Options / Dropdown
   */

  const setTextBoxAndOptions = async (
    options: string[],
    inputValue: string
  ) => {
    // @Input
    componentInstance.options = options;
    componentInstance.searchControl.setValue(inputValue);
    textbox.focus();

    changeDetection.detectChanges();
  };

  const OPTIONS = ["test", "test2", "test3"],
    INPUT_VALUE = "test";

  /**
   * Check options show correctly
   */
  it("@Input() options should show options in the list after textbox focus and edit", async () => {
    setTextBoxAndOptions(OPTIONS, INPUT_VALUE);

    const options = component.getAllByTestId("autocompleteOption");
    expect(options.length).toBe(3);
  });

  /**
   * Check clicking an option emits the selected option
   */
  it("should emit the selected option when an option is clicked", (done: DoneFn) => {
    setTextBoxAndOptions(OPTIONS, INPUT_VALUE);

    // @Output
    componentInstance.optionSelected.subscribe((option) => {
      expect(option).toBe(OPTIONS[1]);
      done();
    });

    const options = component.getAllByTestId("autocompleteOption");
    options[1].click();
  });

  /**
   * Check enter key selects the selected option
   */
  it("should emit the selected option when the enter key is pressed on an option", (done: DoneFn) => {
    setTextBoxAndOptions(OPTIONS, INPUT_VALUE);

    // @Output
    componentInstance.optionSelected.subscribe((option) => {
      expect(option).toBe(OPTIONS[2]);
      done();
    });

    textbox.focus();

    // Navigate down twice
    textbox.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    textbox.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));

    // Select the option
    textbox.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  });

  /**
   * Check disabled Input disables the input
   */
  it("@Input() disabled should disable the input", async () => {
    componentInstance.disabled = true;
    changeDetection.detectChanges();

    expect(componentInstance.searchControl.disabled).toBe(true);
  });

  // TODO: Test the valueChange event
});
