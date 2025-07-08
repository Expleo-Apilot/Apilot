using System.Text;
using Apilot.Domain.Enums;
using AutoMapper;
using dev.Application.DTOs.Collection;
using dev.Application.DTOs.Request;
using dev.Application.DTOs.Swagger;
using dev.Application.Interfaces;
using dev.Domain.Entities;
using dev.Infrastructure.Common;
using dev.Infrastructure.Data;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi.Readers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace dev.Infrastructure.Services;

public class OpenApiImportService : IOpenApiImportService
{
    private readonly ILogger<OpenApiImportService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IOpenApiFileHandlerService _fileHandlerService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ICollectionService _collectionService;
    private readonly IRequestService _requestService;

    public OpenApiImportService(
        ApplicationDbContext context,
        ILogger<OpenApiImportService> logger,
        IHttpClientFactory httpClientFactory,
        ICollectionService collectionService,
        IRequestService requestService, IOpenApiFileHandlerService fileHandlerService)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _collectionService = collectionService ?? throw new ArgumentNullException(nameof(collectionService));
        _requestService = requestService ?? throw new ArgumentNullException(nameof(requestService));
        _fileHandlerService = fileHandlerService;
    }

    public async Task<CollectionDto> ImportOpenApiCollectionAsync(OpenApiImportRequest importRequest)
    {
        try
        {
            _logger.LogInformation("Starting OpenAPI import for {Source}", importRequest.SourceUrl ?? "local file");

            var openApiDocument = await ReadOpenApiSpecificationAsync(importRequest);
            
            var collectionRequest = new CreateCollectionDto
            {
                Name = openApiDocument.Info.Title,
                WorkSpaceId = importRequest.WorkspaceId,
                Description = openApiDocument.Info.Description ?? string.Empty
            };

            var collection = await _collectionService.CreateCollectionAsync(collectionRequest);
            
            await ImportRequestsIntoFoldersAsync(openApiDocument, collection.Id);

            _logger.LogInformation("OpenAPI import completed successfully. Collection ID: {CollectionId}", collection.Id);

            return collection;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing OpenAPI specification");
            throw;
        }
    }
    
    
    public async Task<CollectionDto> ImportOpenApiFromFileAsync(OpenApiFileUploadRequest fileImportRequest)
    {
        try
        {
            _logger.LogInformation("Starting OpenAPI import from file: {FileName}", fileImportRequest.File.FileName);
            
            var fileUploadRequest = new OpenApiFileUploadRequest
            {
                File = fileImportRequest.File,
                WorkspaceId = fileImportRequest.WorkspaceId
            };
            
            
            var importRequest = await _fileHandlerService.ProcessUploadedFileAsync(fileUploadRequest);
            
            return await ImportOpenApiCollectionAsync(importRequest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing OpenAPI from file");
            throw;
        }
    }
    

    
    private async Task<OpenApiDocument> ReadOpenApiSpecificationAsync(OpenApiImportRequest importRequest)
    {
        string content;

        if (!string.IsNullOrWhiteSpace(importRequest.SourceUrl))
        {
            var client = _httpClientFactory.CreateClient();
            content = await client.GetStringAsync(importRequest.SourceUrl);
        }
        else if (!string.IsNullOrWhiteSpace(importRequest.FileContent))
        {
            content = importRequest.FileContent;
        }
        else
        {
            throw new ArgumentException("No source provided for OpenAPI import");
        }

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
        var openApiReader = new OpenApiStreamReader();
        var openApiDocument = openApiReader.Read(stream, out var diagnostic);

        if (diagnostic.Errors.Any())
        {
            _logger.LogError("OpenAPI specification validation errors: {Errors}", 
                string.Join(", ", diagnostic.Errors.Select(e => e.Message)));
            throw new InvalidOperationException("Invalid OpenAPI specification");
        }

        return openApiDocument;
    }

    private async Task ImportRequestsIntoFoldersAsync(OpenApiDocument openApiDocument, int collectionId)
    {
        var foldersByTag = new Dictionary<string, int>();

        foreach (var pathItem in openApiDocument.Paths)
        {
            foreach (var operation in pathItem.Value.Operations)
            {
                var tags = operation.Value.Tags?.Select(t => t.Name).ToList();
                if (tags == null || !tags.Any())
                {
                    tags = new List<string> { "Default" };
                }
                
                var primaryTag = tags.First();
                
                if (!foldersByTag.ContainsKey(primaryTag))
                {
                    var folderId = await CreateFolderAsync(primaryTag, collectionId);
                    foldersByTag[primaryTag] = folderId;
                }
                
                var createRequest = new CreateRequestDto
                {
                    Name = SwaggerUtil.GenerateRequestName(pathItem.Key),
                    Url = SwaggerUtil.GenerateFullUrl(openApiDocument, pathItem.Key),
                    HttpMethod = SwaggerUtil.MapHttpMethod(operation.Key),
                   // CollectionId = collectionId,
                    FolderId = foldersByTag[primaryTag],  
                    Headers = SwaggerUtil.ExtractHeaders(operation.Value),
                    Body = SwaggerUtil.GenerateBodyFromSchema(operation.Value.RequestBody),
                    Parameters = SwaggerUtil.ExtractQueryParameters(operation.Value)
                };

                await _requestService.CreateRequestAsync(createRequest);
            }
        }
    }

    private async Task<int> CreateFolderAsync(string folderName, int collectionId)
    {
        var folder = new Folder
        {
            Name = folderName,
            CollectionId = collectionId
        };
        
        _context.Folders.Add(folder);
        await _context.SaveChangesAsync();
        
        return folder.Id;
    }
    
}

