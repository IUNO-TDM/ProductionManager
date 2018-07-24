import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchasedObjectsComponent } from './purchased-objects.component';

describe('PurchasedObjectsComponent', () => {
  let component: PurchasedObjectsComponent;
  let fixture: ComponentFixture<PurchasedObjectsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PurchasedObjectsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PurchasedObjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
