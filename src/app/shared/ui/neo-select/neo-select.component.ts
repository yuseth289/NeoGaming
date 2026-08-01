import { Component, Input, booleanAttribute, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface NeoSelectOption {
  label: string;
  value: string;
}

let nextSelectId = 0;

@Component({
  selector: 'app-neo-select',
  standalone: true,
  templateUrl: './neo-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeoSelectComponent),
      multi: true,
    },
  ],
})
export class NeoSelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() options: NeoSelectOption[] = [];
  @Input({ transform: booleanAttribute }) disabled = false;

  protected readonly selectId = `neo-select-${++nextSelectId}`;
  protected value = '';
  private cvaDisabled = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected get isDisabled(): boolean {
    return this.disabled || this.cvaDisabled;
  }

  protected selectClasses(): string {
    return [
      'h-11 w-full rounded-neo-md border bg-neo-elevated px-3 text-neo-white',
      'transition-neo duration-neo ease-neo focus:border-neo-cyan focus:outline-none focus:ring-1 focus:ring-neo-cyan',
      'disabled:cursor-not-allowed disabled:opacity-60',
      this.error ? 'border-red-500 ring-1 ring-red-500' : 'border-neo-border',
    ].join(' ');
  }

  protected handleChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChange(target.value);
  }

  protected handleBlur(): void {
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled = isDisabled;
  }
}
