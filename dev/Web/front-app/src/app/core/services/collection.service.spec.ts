import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CollectionService } from './collection.service';
import { Collection, CreateCollectionRequest, UpdateCollectionRequest } from '../models/collection.model';

describe('CollectionService', () => {
  let service: CollectionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CollectionService]
    });
    service = TestBed.inject(CollectionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a collection', () => {
    const mockRequest: CreateCollectionRequest = {
      name: 'Test Collection',
      description: 'Test Description',
      workSpaceId: 1
    };

    const mockResponse = {
      isSuccess: true,
      data: {
        id: 1,
        name: 'Test Collection',
        description: 'Test Description',
        workSpaceId: 1,
        createdAt: '2025-05-24T10:00:00',
        updatedAt: null,
        createdBy: 'admin',
        updatedBy: null,
        lastSyncDate: null,
        syncId: 'test-sync-id',
        folders: [],
        requests: []
      },
      error: null
    };

    service.createCollection(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/CreateCollection');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should get all collections', () => {
    const mockResponse = {
      isSuccess: true,
      data: [
        {
          id: 1,
          name: 'Collection 1',
          description: 'Description 1',
          workSpaceId: 1,
          createdAt: '2025-05-24T10:00:00',
          updatedAt: null,
          createdBy: 'admin',
          updatedBy: null,
          lastSyncDate: null,
          syncId: 'sync-id-1',
          folders: [],
          requests: []
        }
      ],
      error: null
    };

    service.getCollections().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/GetCollections');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get a collection by ID', () => {
    const mockResponse = {
      isSuccess: true,
      data: {
        id: 1,
        name: 'Collection 1',
        description: 'Description 1',
        workSpaceId: 1,
        createdAt: '2025-05-24T10:00:00',
        updatedAt: null,
        createdBy: 'admin',
        updatedBy: null,
        lastSyncDate: null,
        syncId: 'sync-id-1',
        folders: [],
        requests: []
      },
      error: null
    };

    service.getCollection(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/GetCollection?id=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get collections by workspace ID', () => {
    const mockResponse = {
      isSuccess: true,
      data: [
        {
          id: 1,
          name: 'Collection 1',
          description: 'Description 1',
          workSpaceId: 1,
          createdAt: '2025-05-24T10:00:00',
          updatedAt: null,
          createdBy: 'admin',
          updatedBy: null,
          lastSyncDate: null,
          syncId: 'sync-id-1',
          folders: [],
          requests: []
        }
      ],
      error: null
    };

    service.getCollectionsByWorkspaceId(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/GetCollectionsByWorkspaceId?id=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should update a collection', () => {
    const mockRequest: UpdateCollectionRequest = {
      id: 1,
      name: 'Updated Collection',
      description: 'Updated Description',
      workSpaceId: 1
    };

    const mockResponse = {
      isSuccess: true,
      data: {},
      error: null
    };

    service.updateCollection(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/UpdateCollection');
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete a collection', () => {
    const mockResponse = {
      isSuccess: true,
      data: {},
      error: null
    };

    service.deleteCollection(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/DeleteCollection?id=1');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });
});
