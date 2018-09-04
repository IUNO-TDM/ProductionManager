import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({
  name: 'satoshi2iuno'
})
export class Satoshi2IunoPipe extends DecimalPipe implements PipeTransform {

  transform(value: number, args?: any): any {
    const iuno = super.transform(value / 100000, args)
    const iunoString = '' + iuno + ' IUNO'
    return iunoString;
  }

}
