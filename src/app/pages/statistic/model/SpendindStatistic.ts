import { FormControl, FormGroup } from "@angular/forms";
import moment from "moment";
import { Category } from "../../../domain/category.domain";

export interface ICategoryStatistic {
    category: Category,
    value: number,
    children?: ICategoryStatistic[] | undefined
}

export interface RangeForm {
    startDate: FormControl<moment.Moment>;
    endDate: FormControl<moment.Moment>;
    compareStartDate: FormControl<moment.Moment>;
    compareEndDate: FormControl<moment.Moment>;
}

export const formInitializer = {
    startDateCtrl: new FormControl(moment().startOf('month')),
    endDateCtrl: new FormControl(moment()),
    compareStartDateCtrl: new FormControl(moment()),
    compareEndDateCtrl: new FormControl(moment()),
  };

export const initializeFormGroup = (): FormGroup => {
    // const compareStartthis.startDateCtrl.value.subtract(1, 'days'));
    // this.compareEndDateCtrl.setValue(this.compareStartDateCtrl.value.subtract(30, 'days'));
    return new FormGroup({
        startDate: formInitializer.startDateCtrl,
        endDate: formInitializer.endDateCtrl,
        compareStartDate: formInitializer.compareStartDateCtrl,
        compareEndDate: formInitializer.compareEndDateCtrl,
    });
};