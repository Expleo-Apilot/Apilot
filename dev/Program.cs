using System.Text.Json.Serialization;
using dev.Application.DTOs.Request;
using dev.Application.Interfaces;
using dev.Infrastructure.Data;
using dev.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});


builder.Services.AddScoped<IWorkspaceService, WorkspaceService>();
builder.Services.AddScoped<ICollectionService , CollectionService>();
builder.Services.AddScoped<IFolderService , FolderService>();
builder.Services.AddScoped<IRequestService , RequestService>();
builder.Services.AddScoped<IEnvironmentService , EnvironmentService>();
builder.Services.AddScoped<IResponseService , ResponseService>();
builder.Services.AddScoped<IHistoryService , HistoryService>();

builder.Services.AddHttpClient<IPerformRequestService, PerformRequestService>();

builder.Services.AddAutoMapper(typeof(Program));
builder.Services.AddMediatR(cfg => 
{
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy => policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
    );
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();
app.UseCors("AllowAngularApp");

app.Run();

