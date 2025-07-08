import { TestBed } from '@angular/core/testing';

import { TempFixService } from './temp-fix.service';

describe('TempFixService', () => {
  let service: TempFixService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TempFixService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
