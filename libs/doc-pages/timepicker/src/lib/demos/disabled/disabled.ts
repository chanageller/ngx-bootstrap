import { Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'demo-timepicker-disabled',
  templateUrl: './disabled.html',
  standalone: false
})
export class DemoTimepickerDisabledComponent {
  isMeridian = true;
  isDisabled = true;
  myTime = new Date();
}
