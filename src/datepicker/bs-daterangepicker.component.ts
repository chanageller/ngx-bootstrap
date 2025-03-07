import {
  AfterViewInit, ComponentRef,
  Directive, ElementRef, EventEmitter, HostBinding,
  Input, OnChanges, OnDestroy, OnInit,
  Output, Renderer2, SimpleChanges,
  ViewContainerRef
} from '@angular/core';
import { BsDaterangepickerConfig } from './bs-daterangepicker.config';
import { BsDaterangepickerContainerComponent } from './themes/bs/bs-daterangepicker-container.component';
import { Observable, Subscription, Subject, BehaviorSubject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ComponentLoaderFactory, ComponentLoader } from 'ngx-bootstrap/component-loader';
import { BsDatepickerConfig } from './bs-datepicker.config';
import { DatepickerDateCustomClasses } from './models';
import {
  checkBsValue,
  checkRangesWithMaxDate,
  setDateRangesCurrentTimeOnDateSelect
} from './utils/bs-calendar-utils';

export let previousDate: (Date | undefined)[] | undefined;


@Directive({
    selector: '[bsDaterangepicker]',
    exportAs: 'bsDaterangepicker',
    standalone: true,
    providers: [
      ComponentLoaderFactory
    ]
})
export class BsDaterangepickerDirective
  implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  /**
   * Placement of a daterangepicker. Accepts: "top", "bottom", "left", "right"
   */
  @Input() placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  /**
   * Specifies events that should trigger. Supports a space separated list of
   * event names.
   */
  @Input() triggers = 'click';
  /**
   * Close daterangepicker on outside click
   */
  @Input() outsideClick = true;
  /**
   * A selector specifying the element the daterangepicker should be appended to.
   */
  @Input() container = 'body';

  @Input() outsideEsc = true;

  /**
   * Returns whether or not the daterangepicker is currently being shown
   */
  @Input()
  get isOpen(): boolean {
    return this._datepicker.isShown;
  }

  set isOpen(value: boolean) {
    this.isOpen$.next(value);
  }

  /**
   * Emits an event when the daterangepicker is shown
   */
  @Output() onShown: EventEmitter<unknown>;
  /**
   * Emits an event when the daterangepicker is hidden
   */
  @Output() onHidden: EventEmitter<unknown>;

  _bsValue?: (Date|undefined)[];
  isOpen$: BehaviorSubject<boolean>;
  isDestroy$ = new Subject();

  /**
   * Initial value of daterangepicker
   */
  @Input()
  set bsValue(value: (Date|undefined)[] | undefined) {
    if (this._bsValue === value) {
      return;
    }

    if (value && this.bsConfig?.initCurrentTime) {
      value = setDateRangesCurrentTimeOnDateSelect(value);
    }
    this.initPreviousValue();
    this._bsValue = value;
    this.bsValueChange.emit(value);
  }

  /**
   * Config object for daterangepicker
   */
  @Input() bsConfig?: Partial<BsDaterangepickerConfig>;
  /**
   * Indicates whether daterangepicker's content is enabled or not
   */
  @Input() isDisabled = false;
  /**
   * Minimum date which is available for selection
   */
  @Input() minDate?: Date;
  /**
   * Maximum date which is available for selection
   */
  @Input() maxDate?: Date;
  /**
   * Date custom classes
   */
  @Input() dateCustomClasses?: DatepickerDateCustomClasses[];
  /**
   * Disable specific days, e.g. [0,6] will disable all Saturdays and Sundays
   */
  @Input() daysDisabled?: number[];
  /**
   * Disable specific dates
   */
  @Input() datesDisabled?: Date[];

  /**
   * Enable specific dates
   */
  @Input() datesEnabled?: Date[];
  /**
   * Emits when daterangepicker value has been changed
   */
  @Output() bsValueChange = new EventEmitter<((Date|undefined)[]|undefined)>();

  @HostBinding ('attr.readonly') get isDatepickerReadonly() {
    return this.isDisabled ? '' : null;
  }

  get rangeInputFormat$(): Observable<string> {
    return this._rangeInputFormat$;
  }

  protected _subs: Subscription[] = [];
  private _datepicker: ComponentLoader<BsDaterangepickerContainerComponent>;
  private _datepickerRef?: ComponentRef<BsDaterangepickerContainerComponent>;
  private readonly _rangeInputFormat$ = new Subject<string>();

  constructor(public _config: BsDaterangepickerConfig,
              private  _elementRef: ElementRef,
              private  _renderer: Renderer2,
              _viewContainerRef: ViewContainerRef,
              cis: ComponentLoaderFactory) {
    this._datepicker = cis.createLoader<BsDaterangepickerContainerComponent>(
      _elementRef,
      _viewContainerRef,
      _renderer
    );
    Object.assign(this, _config);
    this.onShown = this._datepicker.onShown;
    this.onHidden = this._datepicker.onHidden;
    this.isOpen$ = new BehaviorSubject(this.isOpen);
  }

  ngOnInit(): void {
    this.isDestroy$ = new Subject();
    this._datepicker.listen({
      outsideClick: this.outsideClick,
      outsideEsc: this.outsideEsc,
      triggers: this.triggers,
      show: () => this.show()
    });
    this.initPreviousValue();
    this.setConfig();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["bsConfig"]) {
      if (changes["bsConfig"].currentValue?.initCurrentTime && changes["bsConfig"].currentValue?.initCurrentTime !== changes["bsConfig"].previousValue?.initCurrentTime && this._bsValue) {
        this.initPreviousValue();
        this._bsValue = setDateRangesCurrentTimeOnDateSelect(this._bsValue);
        this.bsValueChange.emit(this._bsValue);
      }

      this.setConfig();
      this._rangeInputFormat$.next(changes["bsConfig"].currentValue && changes["bsConfig"].currentValue.rangeInputFormat);
    }


    if (!this._datepickerRef || !this._datepickerRef.instance) {
      return;
    }
    if (changes["minDate"]) {
      this._datepickerRef.instance.minDate = this.minDate;
    }
    if (changes["maxDate"]) {
      this._datepickerRef.instance.maxDate = this.maxDate;
    }
    if (changes["datesDisabled"]) {
      this._datepickerRef.instance.datesDisabled = this.datesDisabled;
    }
    if (changes["datesEnabled"]) {
      this._datepickerRef.instance.datesEnabled = this.datesEnabled;
    }
    if (changes["daysDisabled"]) {
      this._datepickerRef.instance.daysDisabled = this.daysDisabled;
    }
    if (changes["isDisabled"]) {
      this._datepickerRef.instance.isDisabled = this.isDisabled;
    }
    if (changes["dateCustomClasses"]) {
      this._datepickerRef.instance.dateCustomClasses = this.dateCustomClasses;
    }
  }

  ngAfterViewInit(): void {
    this.isOpen$.pipe(
      filter(isOpen => isOpen !== this.isOpen),
      takeUntil(this.isDestroy$)
    )
      .subscribe(() => this.toggle());
  }

  /**
   * Opens an element’s datepicker. This is considered a “manual” triggering of
   * the datepicker.
   */
  show(): void {
    if (this._datepicker.isShown) {
      return;
    }

    this.setConfig();

    this._datepickerRef = this._datepicker
      .provide({ provide: BsDatepickerConfig, useValue: this._config })
      .attach(BsDaterangepickerContainerComponent)
      .to(this.container)
      .position({ attachment: this.placement })
      .show({ placement: this.placement });

    this.initSubscribes();
  }

  initSubscribes() {
    // if date changes from external source (model -> view)
    this._subs.push(
      this.bsValueChange.subscribe((value: Date[]) => {
        if (this._datepickerRef) {
          this._datepickerRef.instance.value = value;
        }
      })
    );

    // if date changes from picker (view -> model)
    if (this._datepickerRef) {
      this._subs.push(
        this._datepickerRef.instance.valueChange
          .pipe(
            filter((range: Date[]) => range && range[0] && !!range[1])
          )
          .subscribe((value: Date[]) => {
            this.initPreviousValue();
            this.bsValue = value;
            if (this.keepDatepickerModalOpened()) {
              return;
            }

            this.hide();
          })
      );
    }
  }

  initPreviousValue() {
    previousDate = this._bsValue;
  }

  keepDatepickerModalOpened(): boolean {
    if (!previousDate || !this.bsConfig?.keepDatepickerOpened || !this._config.withTimepicker) {
      return false;
    }

    return this.isDateSame();
  }

  isDateSame(): boolean {
    return ((this._bsValue?.[0]?.getDate() === previousDate?.[0]?.getDate())
      && (this._bsValue?.[0]?.getMonth() === previousDate?.[0]?.getMonth())
      && (this._bsValue?.[0]?.getFullYear() === previousDate?.[0]?.getFullYear())
      && (this._bsValue?.[1]?.getDate() === previousDate?.[1]?.getDate())
      && (this._bsValue?.[1]?.getMonth() === previousDate?.[1]?.getMonth())
      && (this._bsValue?.[1]?.getFullYear() === previousDate?.[1]?.getFullYear())
    );
  }

  /**
   * Set config for daterangepicker
   */
  setConfig() {
    this._config = Object.assign(
      {},
      this._config,
      this.bsConfig,
      {
        value: this.bsConfig?.keepDatesOutOfRules ? this._bsValue : checkBsValue(this._bsValue, this.maxDate || this.bsConfig && this.bsConfig.maxDate),
        isDisabled: this.isDisabled,
        minDate: this.minDate || this.bsConfig && this.bsConfig.minDate,
        maxDate: this.maxDate || this.bsConfig && this.bsConfig.maxDate,
        daysDisabled: this.daysDisabled || this.bsConfig && this.bsConfig.daysDisabled,
        dateCustomClasses: this.dateCustomClasses || this.bsConfig && this.bsConfig.dateCustomClasses,
        datesDisabled: this.datesDisabled || this.bsConfig && this.bsConfig.datesDisabled,
        datesEnabled: this.datesEnabled || this.bsConfig && this.bsConfig.datesEnabled,
        ranges: checkRangesWithMaxDate(this.bsConfig && this.bsConfig.ranges, this.maxDate || this.bsConfig && this.bsConfig.maxDate),
        maxDateRange: this.bsConfig && this.bsConfig.maxDateRange,
        initCurrentTime: this.bsConfig?.initCurrentTime,
        keepDatepickerOpened: this.bsConfig?.keepDatepickerOpened,
        keepDatesOutOfRules: this.bsConfig?.keepDatesOutOfRules
      }
    );
  }

  /**
   * Closes an element’s datepicker. This is considered a “manual” triggering of
   * the datepicker.
   */
  hide(): void {
    if (this.isOpen) {
      this._datepicker.hide();
    }
    for (const sub of this._subs) {
      sub.unsubscribe();
    }

    if (this._config.returnFocusToInput) {
      this._renderer.selectRootElement(this._elementRef.nativeElement).focus();
    }
  }

  /**
   * Toggles an element’s datepicker. This is considered a “manual” triggering
   * of the datepicker.
   */
  toggle(): void {
    if (this.isOpen) {
      return this.hide();
    }

    this.show();
  }

  unsubscribeSubscriptions() {
    if (this._subs?.length) {
      this._subs.map(sub => sub.unsubscribe());
      this._subs.length = 0;
    }
  }

  ngOnDestroy(): void {
    this._datepicker.dispose();
    this.isOpen$.next(false);
    if (this.isDestroy$) {
      this.isDestroy$.next(null);
      this.isDestroy$.complete();
    }

    this.unsubscribeSubscriptions();
  }
}
