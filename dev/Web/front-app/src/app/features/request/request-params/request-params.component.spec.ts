import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestParamsComponent } from './request-params.component';

describe('RequestParamsComponent', () => {
  let component: RequestParamsComponent;
  let fixture: ComponentFixture<RequestParamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RequestParamsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestParamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
