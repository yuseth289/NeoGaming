import { Component, Input, forwardRef, booleanAttribute } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  LucideAngularModule,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
  type LucideIconData,
} from 'lucide-angular';

type NeoInputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'textarea';

const iconMap: Record<string, LucideIconData> = {
  search: Search,
  mail: Mail,
  email: Mail,
  lock: Lock,
  user: User,
  phone: Phone,
  'map-pin': MapPin,
  card: CreditCard,
  'credit-card': CreditCard,
};

let nextInputId = 0;

@Component({
  selector: 'app-neo-input, neo-input',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './neo-input.component.html',
  host: { class: 'block' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeoInputComponent),
      multi: true,
    },
  ],
})
export class NeoInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: NeoInputType = 'text';
  @Input() error = '';
  @Input() hint = '';
  @Input() icon = '';
  @Input() rows = 4;
  @Input({ transform: booleanAttribute }) labelSrOnly = false;
  @Input({ transform: booleanAttribute }) disabled = false;

  protected readonly inputId = `neo-input-${++nextInputId}`;
  protected readonly icons = {
    eye: Eye,
    eyeOff: EyeOff,
  };

  protected value: string | number = '';
  protected passwordVisible = false;
  private cvaDisabled = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected get isDisabled(): boolean {
    return this.disabled || this.cvaDisabled;
  }

  protected get resolvedType(): Exclude<NeoInputType, 'textarea'> | 'text' {
    if (this.type === 'textarea') {
      return 'text';
    }

    return this.type === 'password' && this.passwordVisible ? 'text' : this.type;
  }

  protected get iconData(): LucideIconData | null {
    return iconMap[this.icon.trim().toLowerCase()] ?? null;
  }

  protected inputClasses(): string {
    return [
      this.type === 'textarea' ? 'min-h-28 py-3' : 'min-h-11',
      'w-full rounded-neo-md border bg-neo-elevated text-neo-white placeholder-neo-muted',
      'transition-neo duration-neo ease-neo focus:border-neo-cyan focus:outline-none focus:ring-1 focus:ring-neo-cyan',
      'disabled:cursor-not-allowed disabled:opacity-60',
      this.iconData ? 'pl-10' : 'pl-3',
      this.type === 'password' ? 'pr-10' : 'pr-3',
      this.error ? 'border-red-500 ring-1 ring-red-500' : 'border-neo-border',
    ].join(' ');
  }

  protected handleInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(target.value);
  }

  protected handleBlur(): void {
    this.onTouched();
  }

  protected togglePasswordVisibility(): void {
    if (!this.isDisabled) {
      this.passwordVisible = !this.passwordVisible;
    }
  }

  writeValue(value: string | number | null): void {
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
