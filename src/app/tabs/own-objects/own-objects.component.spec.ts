import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnObjectsComponent } from './own-objects.component';

describe('OwnObjectsComponent', () => {
  let component: OwnObjectsComponent;
  let fixture: ComponentFixture<OwnObjectsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OwnObjectsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OwnObjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
