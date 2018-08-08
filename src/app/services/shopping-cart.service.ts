import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { BehaviorSubject, Observable} from 'rxjs'
import { tap } from "rxjs/operators"

export class ShoppingCartItem {
  id: string
  objectId: string
  amount: number
  updated: string
}

@Injectable({
  providedIn: 'root'
})
export class ShoppingCartService {
  apiUrl = "/api/"

  // shopping cart items. The subject is updated by the updateItems function which
  // is called from the constructor and after each shopping cart manipulating action.
  private _items: BehaviorSubject<ShoppingCartItem[]> = new BehaviorSubject([])
  public readonly items: Observable<ShoppingCartItem[]> = this._items.asObservable()

  constructor(
    private http: HttpClient,
  ) {
    this.updateItems()
  }

  /**
   * Adds the object to the shopping cart.
   * @param object the object to add to the shopping cart.
   * @returns an observable with the http request.
   */
  addToShoppingCart(object) {
    const url = this.apiUrl + "shopping_cart/items"
    
    const body = {
      "objectId": object.id,
      "amount": 1
    }
    return this.http.post(url, body).pipe(
      tap(val => this.updateItems())
    )
  }

  /**
   * Removes a shopping cart item from the shopping cart.
   * @param item the item to remove from the shopping cart.
   * @returns an observable with the http request.
   */
  removeItem(item) {
    const url = this.apiUrl + "shopping_cart/items/"+item._id
    return this.http.delete(url).pipe(
      tap(val => this.updateItems())
    )
  }

  /**
   * Places a machine specific order for the shopping cart.
   * The items of the shopping cart are removed then.
   * @param machineId the id of the machine which this order is placed for.
   * @returns an observable with the http request.
   */
  order(hsmId) {
    const url = this.apiUrl + "shopping_cart/order"

    const body = {
      hsmId: hsmId
    }
    return this.http.post(url, body).pipe(
      tap(val => this.updateItems())
    )
  }

  /**
   * Updates the array of shopping cart items.
   * @param 
   * @returns 
   */
  updateItems() {
    const url = this.apiUrl + "shopping_cart/items"
    this.http.get<ShoppingCartItem[]>(url).subscribe(items => {
      this._items.next(items)
    })
  }


}
