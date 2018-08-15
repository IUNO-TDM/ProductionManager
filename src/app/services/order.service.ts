import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '../models/order';
import { forEach } from '@angular/router/src/utils/collection';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  apiUrl = "/api/"

  constructor(
    private http: HttpClient,
  ) { }

  private mapOrders(orders) {
    return orders.map(order => {
      order.id = order['id']
      return order
    })
  }

  /**
   * Returns the open orders from the marketplace.
   * @param 
   * @returns an observable with the http request
   */
  getOrders() {
    const url = this.apiUrl + "orders"
    return this.http.get<Order[]>(url).pipe(
      map(orders => this.mapOrders(orders))
    )
  }

  getOpenOrders() {
    const url = this.apiUrl + "orders"
    return this.http.get<Order[]>(url).pipe(
      map(orders => orders.filter(order => order.state !== "completed" && order.state !== "canceled")),
      map(orders => this.mapOrders(orders))
    )
  }

  getCompletedOrders() {
    const url = this.apiUrl + "orders"
    return this.http.get<Order[]>(url).pipe(
      map(orders => orders.filter(order => order.state === "completed")),
      map(orders => this.mapOrders(orders))
    )
  }

  updateLicense(order) {
    const url = this.apiUrl + "orders/"+order.id+"/licenseupdate"
    return this.http.get<Order[]>(url)
    // .pipe(
    //   map(orders => this.mapOrders(orders))
    // )
  }

  cancelOrder(order) {
    const url = this.apiUrl + "orders/"+order.id
    return this.http.delete<Order>(url)
  }

}
