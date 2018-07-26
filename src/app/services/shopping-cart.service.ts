import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { BehaviorSubject, Observable} from 'rxjs'
import { tap } from "rxjs/operators"

export class ShoppingCartItem {
  _id: string
  objectId: string
  amount: number
  updated: string
}

@Injectable({
  providedIn: 'root'
})
export class ShoppingCartService {
  apiUrl = "/api/"

  private _items: BehaviorSubject<ShoppingCartItem[]> = new BehaviorSubject([])
  public readonly items: Observable<ShoppingCartItem[]> = this._items.asObservable()

  constructor(
    private http: HttpClient,
  ) {
    this.updateItems()
  }

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

  removeItem(item) {
    const url = this.apiUrl + "shopping_cart/items/"+item._id
    return this.http.delete(url).pipe(
      tap(val => this.updateItems())
    )
  }

  updateItems() {
    const url = this.apiUrl + "shopping_cart/items"
    this.http.get<ShoppingCartItem[]>(url).subscribe(items => {
      this._items.next(items)
    })
  }

}
