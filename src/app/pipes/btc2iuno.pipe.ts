import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({
  name: 'btc2iuno'
})
export class Btc2iunoPipe extends DecimalPipe implements PipeTransform {

  transform(value: number, args?: any): any {
    const iuno = super.transform(value * 1000, args)
    const iunoString = '' + iuno + ' IUNO'
    return iunoString;
  }

}
