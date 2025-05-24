import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { FolderService } from './folder.service';
import { Folder, CreateFolderRequest, UpdateFolderRequest } from '../models/folder.model';

describe('FolderService', () => {
  let service: FolderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FolderService]
    });
    service = TestBed.inject(FolderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a folder', () => {
    const mockRequest: CreateFolderRequest = {
      name: 'Test Folder',
      collectionId: 1
    };

    const mockResponse = {
      isSuccess: true,
      data: {
        id: 1,
        name: 'Test Folder',
        collectionId: 1,
        createdAt: '2025-05-24T10:00:00',
        updatedAt: null,
        createdBy: 'Admin',
        updatedBy: null,
        lastSyncDate: null,
        syncId: 'test-sync-id',
        requests: []
      },
      error: null
    };

    service.createFolder(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/CreateFolder');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should get all folders', () => {
    const mockResponse = {
      isSuccess: true,
      data: [
        {
          id: 1,
          name: 'Folder 1',
          collectionId: 1,
          createdAt: '2025-05-24T10:00:00',
          updatedAt: null,
          createdBy: 'Admin',
          updatedBy: null,
          lastSyncDate: null,
          syncId: 'sync-id-1',
          requests: []
        }
      ],
      error: null
    };

    service.getFolders().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/GetFolders');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get a folder by ID', () => {
    const mockResponse = {
      isSuccess: true,
      data: {
        id: 1,
        name: 'Folder 1',
        collectionId: 1,
        createdAt: '2025-05-24T10:00:00',
        updatedAt: null,
        createdBy: 'Admin',
        updatedBy: null,
        lastSyncDate: null,
        syncId: 'sync-id-1',
        requests: []
      },
      error: null
    };

    service.getFolder(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/GetFolder?id=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get folders by collection ID', () => {
    const mockResponse = {
      isSuccess: true,
      data: [
        {
          id: 1,
          name: 'Folder 1',
          collectionId: 1,
          createdAt: '2025-05-24T10:00:00',
          updatedAt: null,
          createdBy: 'Admin',
          updatedBy: null,
          lastSyncDate: null,
          syncId: 'sync-id-1',
          requests: []
        }
      ],
      error: null
    };

    service.getFoldersByCollectionId(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/GetFoldersByCollectionId?id=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should update a folder', () => {
    const mockRequest: UpdateFolderRequest = {
      id: 1,
      name: 'Updated Folder',
      collectionId: 1
    };

    const mockResponse = {
      isSuccess: true,
      data: {},
      error: null
    };

    service.updateFolder(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/UpdateFolder');
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete a folder', () => {
    const mockResponse = {
      isSuccess: true,
      data: {},
      error: null
    };

    service.deleteFolder(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:5051/DeleteFolder?id=1');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });
});
