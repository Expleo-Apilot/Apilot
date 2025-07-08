import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabsAreaComponent } from './tabs-area.component';

describe('TabsAreaComponent', () => {
  let component: TabsAreaComponent;
  let fixture: ComponentFixture<TabsAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TabsAreaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabsAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
