import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  apiUrl = "/api/"

  constructor(
    private http: HttpClient,
  ) { }

  /**
   * Returns the open orders from the marketplace.
   * @param 
   * @returns an observable with the http request
   */
  getOrders() {
    const url = this.apiUrl + "orders"
    return this.http.get<Order[]>(url)
  }

  getOpenOrders() {
    const url = this.apiUrl + "orders"
    return this.http.get<Order[]>(url).pipe(
      map(orders => orders.filter(order => order.state !== "completed" && order.state !== "canceled"))
    )
  }

}
