using dev.Application.DTOs.Swagger;
using dev.Application.Interfaces;
using Newtonsoft.Json;
using YamlDotNet.Core;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;


namespace dev.Infrastructure.Services;

public class OpenApiFileHandlerService : IOpenApiFileHandlerService
{
    private readonly ILogger<OpenApiFileHandlerService> _logger;

    public OpenApiFileHandlerService(ILogger<OpenApiFileHandlerService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    public async Task<OpenApiImportRequest> ProcessUploadedFileAsync(OpenApiFileUploadRequest fileUploadRequest)
    {
        if (fileUploadRequest.File == null || fileUploadRequest.File.Length == 0)
        {
            throw new ArgumentException("No file was uploaded");
        }

        _logger.LogInformation("Processing uploaded OpenAPI file: {FileName}", fileUploadRequest.File.FileName);

        string fileContent;
        using (var streamReader = new StreamReader(fileUploadRequest.File.OpenReadStream()))
        {
            fileContent = await streamReader.ReadToEndAsync();
        }
        
        string fileExtension = Path.GetExtension(fileUploadRequest.File.FileName).ToLowerInvariant();
        if (fileExtension == ".yaml" || fileExtension == ".yml")
        {
            fileContent = ConvertYamlToJson(fileContent);
        }
        else if (fileExtension != ".json")
        {
            throw new ArgumentException("Unsupported file format. Only JSON and YAML files are supported.");
        }
        
        try
        {
            JsonConvert.DeserializeObject(fileContent);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Invalid JSON structure in the uploaded file");
            throw new ArgumentException("The file does not contain valid JSON or YAML OpenAPI specification");
        }

        return new OpenApiImportRequest
        {
            FileContent = fileContent,
            WorkspaceId = fileUploadRequest.WorkspaceId
        };
    }
    
    private string ConvertYamlToJson(string yamlContent)
    {
        try
        {
            _logger.LogInformation("Converting YAML to JSON");
            
            var deserializer = new DeserializerBuilder()
                .WithNamingConvention(CamelCaseNamingConvention.Instance)
                .Build();
                
            var yamlObject = deserializer.Deserialize<object>(yamlContent);
            
            var jsonContent = JsonConvert.SerializeObject(yamlObject, Formatting.Indented);
                
            return jsonContent;
        }
        catch (YamlException ex)
        {
            _logger.LogError(ex, "Error parsing YAML content");
            throw new ArgumentException("Invalid YAML format in the uploaded file");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting YAML to JSON");
            throw;
        }
    }

   
}
