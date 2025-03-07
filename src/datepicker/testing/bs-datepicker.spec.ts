import { Component, Renderer2, ViewChild } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { dispatchKeyboardEvent } from '@ngneat/spectator';
import { registerEscClick } from 'ngx-bootstrap/utils';
import { BsDatepickerDirective } from '../bs-datepicker.component';
import { BsDatepickerConfig } from '../bs-datepicker.config';

import { BsDatepickerModule } from '../bs-datepicker.module';
import { BsDatepickerViewMode, CalendarCellViewModel, WeekViewModel } from '../models';
import { BsDatepickerContainerComponent } from '../themes/bs/bs-datepicker-container.component';

@Component({
    selector: 'test-cmp',
    template: `<input type='text'
                    bsDatepicker
                    [bsConfig]='bsConfig'>`,
    standalone: false
})
class TestComponent {
  @ViewChild(BsDatepickerDirective, { static: false }) datepicker: BsDatepickerDirective;
  bsConfig: Partial<BsDatepickerConfig> = {
    displayMonths: 2,
    selectWeek: true,
    showTodayButton: true
  };
}

type TestFixture = ComponentFixture<TestComponent>;

function getDatepickerDirective(fixture: TestFixture): BsDatepickerDirective {
  return fixture.componentInstance.datepicker;
}

function showDatepicker(fixture: TestFixture): BsDatepickerDirective {
  const datepicker = getDatepickerDirective(fixture);
  datepicker.show();
  fixture.detectChanges();

  return datepicker;
}

function hideDatepicker(fixture: TestFixture): BsDatepickerDirective {
  const datepicker = getDatepickerDirective(fixture);
  datepicker.hide();
  fixture.detectChanges();

  return datepicker;
}

function getDatepickerContainer(datepicker: BsDatepickerDirective): BsDatepickerContainerComponent | null {
  return datepicker[`_datepickerRef`] ? datepicker[`_datepickerRef`].instance : null;
}

describe('datepicker:', () => {
  let fixture: TestFixture;
  beforeEach(
    waitForAsync(() => TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [
        BsDatepickerModule,
        BrowserAnimationsModule
    ]
}).compileComponents()
    ));
  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
  });

  it('should display datepicker on show', fakeAsync(() => {
    const datepicker = showDatepicker(fixture);
    tick(10);
    expect(getDatepickerContainer(datepicker)).toBeDefined();
  }));

  it('should hide datepicker on hide', () => {
    const datepicker = hideDatepicker(fixture);
    expect(getDatepickerContainer(datepicker)).toBeNull();
  });

  it('should select correct year when a month other than selected year is chosen', () => {
    const datepicker = showDatepicker(fixture);
    const datepickerContainerInstance = getDatepickerContainer(datepicker);
    const yearSelection: CalendarCellViewModel = { date: new Date(2017, 1, 1), label: 'label' };
    const monthSelection: CalendarCellViewModel = { date: new Date(2018, 1, 1), label: 'label' };
    datepickerContainerInstance.yearSelectHandler(yearSelection);
    datepickerContainerInstance.monthSelectHandler(monthSelection);
    fixture.detectChanges();
    datepickerContainerInstance[`_store`]
      .select(state => state.view)
      .subscribe(view => {
        expect(view.date.getFullYear()).toEqual(monthSelection.date.getFullYear());
      });
  });

  it('should select a week, when selectWeek flag is true', () => {
    const datepicker = showDatepicker(fixture);
    const datepickerContainerInstance = getDatepickerContainer(datepicker);
    datepickerContainerInstance.setViewMode('day');
    const weekSelection: WeekViewModel = {
      days: [
        { date: new Date(2019, 1, 6), label: 'label' },
        { date: new Date(2019, 1, 7), label: 'label' },
        { date: new Date(2019, 1, 8), label: 'label' },
        { date: new Date(2019, 1, 9), label: 'label' },
        { date: new Date(2019, 1, 10), label: 'label' },
        { date: new Date(2019, 1, 11), label: 'label' },
        { date: new Date(2019, 1, 12), label: 'label' }
      ], isHovered: true
    };
    datepickerContainerInstance.weekHoverHandler(weekSelection);
    fixture.detectChanges();
    datepickerContainerInstance[`_store`]
      .select(state => state.view)
      .subscribe(view => {
        const currentDate = `${view.date.getDate()}${view.date.getFullYear()}`;
        const oldDate = `${weekSelection.days[0].date.getDate()}${weekSelection.days[0].date.getFullYear()}`;
        expect(currentDate).not.toEqual(oldDate);
      });
  });

  it('should hide on esc', waitForAsync(() => {
    const datepicker = showDatepicker(fixture);
    const spy = jest.spyOn(datepicker, 'hide');
    const renderer = fixture.componentRef.injector.get<Renderer2>(Renderer2);

    registerEscClick(renderer, {
      outsideEsc: true,
      target: fixture.nativeElement,
      hide: () => datepicker.hide()
    });

    dispatchKeyboardEvent(document, 'keyup', 'Escape');

    expect(spy).toHaveBeenCalled();
  }));

  it('should show the today button when showTodayButton config is true', fakeAsync(() => {
    showDatepicker(fixture);
    tick();
    fixture.whenStable().then(() => {
      const buttonText: string[] = [];
      Array.from(document.body.getElementsByTagName('button'))
        .forEach(button => buttonText.push(button.textContent));
      expect(buttonText.filter(button => button === 'Today').length).toEqual(1);
    });
    expect(true).toBeTruthy();
  }));

  it('should show custom label for today button if set in config', () => {
    const todayBtnCustomLbl = 'Select today';
    const datepickerDirective = getDatepickerDirective(fixture);
    datepickerDirective.bsConfig = {
      todayButtonLabel: todayBtnCustomLbl,
      showTodayButton: true
    };
    showDatepicker(fixture);

    const buttonText: string[] = [];
    Array.from(document.body.getElementsByTagName('button'))
      .forEach(button => buttonText.push(button.textContent));
    expect(buttonText.filter(button => button === todayBtnCustomLbl).length).toEqual(1);
  });

  it('should show custom label for clear button if set in config', () => {
    const clearBtnCustomLbl = 'Clear current';
    const datepickerDirective = getDatepickerDirective(fixture);
    datepickerDirective.bsConfig = {
      clearButtonLabel: clearBtnCustomLbl,
      showClearButton: true
    };
    showDatepicker(fixture);

    const buttonText: string[] = [];
    // fixture.debugElement.queryAll(By.css('button'))
    Array.from(document.body.getElementsByTagName('button'))
      .forEach(button => buttonText.push(button.textContent));
    expect(buttonText.filter(button => button === clearBtnCustomLbl).length).toEqual(1);
  });

  describe('should start with', () => {

    const parameters = [
      {
        description: 'year view if set in config',
        startView: 'year',
        expectedVisibleContainer: ['bs-years-calendar-view'],
        expectedInvisibleContainer: ['bs-month-calendar-view', 'bs-days-calendar-view'],
        expectedViewMode: 'year'
      },
      {
        description: 'month view if set in config',
        startView: 'month',
        expectedVisibleContainer: ['bs-month-calendar-view'],
        expectedInvisibleContainer: ['bs-years-calendar-view', 'bs-days-calendar-view'],
        expectedViewMode: 'month'
      },
      {
        description: 'day view if set in config',
        startView: 'day',
        expectedVisibleContainer: ['bs-days-calendar-view'],
        expectedInvisibleContainer: ['bs-years-calendar-view', 'bs-month-calendar-view'],
        expectedViewMode: 'day'
      }
    ];

    parameters.forEach(parameter => {
      it(parameter.description, done => {
        const datepickerDirective = getDatepickerDirective(fixture);
        datepickerDirective.bsConfig = {
          startView: parameter.startView as BsDatepickerViewMode
        };

        const bsDatepickerDirective = showDatepicker(fixture);
        const datepickerContainerInstance = getDatepickerContainer(bsDatepickerDirective);

        parameter.expectedVisibleContainer.forEach(container => {
          expect(datepickerContainerInstance[`_element`].nativeElement.querySelectorAll(container)[0]).toBeTruthy();
        });
        parameter.expectedInvisibleContainer.forEach(container => {
          expect(datepickerContainerInstance[`_element`].nativeElement.querySelectorAll(container)[0]).toBeFalsy();
        });
        datepickerContainerInstance.viewMode.subscribe(res => {
          expect(res).toBe(parameter.expectedViewMode);
          done();
        });
      });
    });
  });

  it('should set today date', () => {
    const datepicker = showDatepicker(fixture);
    const datepickerContainerInstance = getDatepickerContainer(datepicker);

    datepickerContainerInstance[`_store`]
      .select(state => state.view)
      .subscribe(view => {
        view.date = new Date(2020, 0, 1);
      }).unsubscribe();
    fixture.detectChanges();

    datepickerContainerInstance[`_store`]
      .select(state => state.view)
      .subscribe(view => {
        expect(`${(view.date.getDate())}-${(view.date.getMonth())}-${(view.date.getFullYear())}`)
          .not.toEqual(`${(new Date().getDate())}-${(new Date().getMonth())}-${(new Date().getFullYear())}`);
      }).unsubscribe();

    datepickerContainerInstance.setToday();
    fixture.detectChanges();

    datepickerContainerInstance[`_store`]
      .select(state => state.view)
      .subscribe(view => {
        expect(`${(view.date.getDate())}-${(view.date.getMonth())}-${(view.date.getFullYear())}`)
          .toEqual(`${(new Date().getDate())}-${(new Date().getMonth())}-${(new Date().getFullYear())}`);
      }).unsubscribe();
  });

  it('should clear date', () => {
    const datepicker = showDatepicker(fixture);
    const datepickerContainerInstance = getDatepickerContainer(datepicker);
    datepickerContainerInstance.clearDate();
    fixture.detectChanges();
    datepickerContainerInstance[`_store`]
      .select(state => state.selectedDate)
      .subscribe(date => {
        expect(date).toBe(undefined);
      }).unsubscribe();
  });

  it('should display one timepicker when withTimepicker is true', () => {
    const datepickerDirective = getDatepickerDirective(fixture);
    datepickerDirective.bsConfig = {
      withTimepicker: true
    };
    showDatepicker(fixture);
    const timepickerZone = document.querySelector('.bs-timepicker-in-datepicker-container');
    const timepickers = document.querySelectorAll('timepicker');
    expect(timepickerZone).toBeTruthy();
    expect(timepickers.length).toEqual(1);
  });

  it('should display one timepicker when withTimepicker is true', () => {
    const datepickerDirective = getDatepickerDirective(fixture);
    datepickerDirective.bsConfig = {
      withTimepicker: true
    };
    const currentDate = new Date();
    const updatedDate = new Date(new Date().setMinutes(currentDate.getMinutes() + 5));
    const datepicker = showDatepicker(fixture);
    const datepickerContainerInstance = getDatepickerContainer(datepicker);
    fixture.detectChanges();

    datepickerContainerInstance.valueChange.emit(currentDate);
    datepickerContainerInstance.timeSelectHandler(currentDate, 0);
    fixture.detectChanges();

    datepickerContainerInstance.valueChange.emit(updatedDate);
    datepickerContainerInstance.timeSelectHandler(updatedDate, 0);

    datepickerContainerInstance[`_store`]
      .select(state => state.selectedTime)
      .subscribe(view => {
        expect(view[0].getMinutes()).toEqual(updatedDate.getMinutes());
      });
  });

  it('should not display timepicker when withTimepicker is false', () => {
    const datepickerDirective = getDatepickerDirective(fixture);
    datepickerDirective.bsConfig = {
      withTimepicker: false
    };
    showDatepicker(fixture);
    const timepickerZone = document.querySelector('.bs-timepicker-in-datepicker-container');
    expect(timepickerZone).not.toBeTruthy();
  });

  it('should hide only if properties with timepicker and keepDatepickerOpened are set to true and only time is changed. Properties are true', () => {
    const datepickerDirective = getDatepickerDirective(fixture);
    datepickerDirective.bsConfig = {
      withTimepicker: true,
      keepDatepickerOpened: true
    };
    const datepicker = showDatepicker(fixture);
    const currentDate = new Date();
    const secondDate = new Date(new Date().setMinutes(currentDate.getMinutes() + 5));

    const datepickerContainerInstance = getDatepickerContainer(datepicker);
    datepickerContainerInstance.valueChange.emit(currentDate);
    fixture.detectChanges();
    const datepickerRef = document.querySelector('bs-datepicker-container');
    expect(datepickerRef).not.toBeNull();

    const datepicker2 = showDatepicker(fixture);
    const datepickerContainerInstance2 = getDatepickerContainer(datepicker2);
    datepickerContainerInstance2.valueChange.emit(secondDate);
    fixture.detectChanges();
    const datepickerRef2 = document.querySelector('bs-datepicker-container');
    expect(datepickerRef2).not.toBeNull();
  });
});
