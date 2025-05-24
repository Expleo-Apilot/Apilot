import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RequestService } from './request.service';
import { HttpMethod } from '../models/http-method.enum';

describe('RequestService', () => {
  let service: RequestService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:5051';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RequestService]
    });
    service = TestBed.inject(RequestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save a request', () => {
    const mockRequest = {
      name: 'requestTest',
      httpMethod: 'GET',
      url: 'https://simple-books-api.glitch.me/status',
      headers: {
        additionalProp1: 'string'
      },
      folderId: 1,
      collectionId: 1
    };

    const mockResponse = {
      isSuccess: true,
      data: {
        id: 1,
        name: 'requestTest',
        httpMethod: 'GET',
        url: 'https://simple-books-api.glitch.me/status',
        headers: {
          additionalProp1: 'string'
        },
        folderId: 1,
        collectionId: 1,
        createdAt: '2025-05-24T16:39:48.8490503+01:00',
        createdBy: 'Admin'
      },
      error: null
    };

    service.saveRequest(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/SaveRequest`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should get all requests', () => {
    const mockResponse = {
      isSuccess: true,
      data: [
        {
          id: 1,
          name: 'requestTest',
          httpMethod: 'GET',
          url: 'https://simple-books-api.glitch.me/status'
        }
      ],
      error: null
    };

    service.getRequests().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/GetRequests`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get a request by ID', () => {
    const mockResponse = {
      isSuccess: true,
      data: {
        id: 1,
        name: 'requestTest',
        httpMethod: 'GET',
        url: 'https://simple-books-api.glitch.me/status'
      },
      error: null
    };

    service.getRequest(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/GetRequest?id=1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get requests by collection ID', () => {
    const mockResponse = {
      isSuccess: true,
      data: [
        {
          id: 1,
          name: 'requestTest',
          httpMethod: 'GET',
          url: 'https://simple-books-api.glitch.me/status'
        }
      ],
      error: null
    };

    service.getRequestsByCollectionId(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/GetRequestsByCollectionId?id=1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get requests by folder ID', () => {
    const mockResponse = {
      isSuccess: true,
      data: [
        {
          id: 1,
          name: 'requestTest',
          httpMethod: 'GET',
          url: 'https://simple-books-api.glitch.me/status'
        }
      ],
      error: null
    };

    service.getRequestsByFolderId(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/GetRequestsByFolderId?id=1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should update a request', () => {
    const mockRequest = {
      id: 1,
      name: 'TestRequestUpdated',
      httpMethod: 'GET',
      url: 'https://simple-books-api.glitch.me'
    };

    const mockResponse = {
      isSuccess: true,
      data: {},
      error: null
    };

    service.updateRequest(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/UpdateRequest`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete a request', () => {
    const mockResponse = {
      isSuccess: true,
      data: {},
      error: null
    };

    service.deleteRequest(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/DeleteRequest?id=1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });
});
