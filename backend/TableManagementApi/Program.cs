using DotNetEnv;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TableManagementBl.Services;
using TableManagementDal.Repositories;
using System;

var builder = WebApplication.CreateBuilder(args);

Env.Load();

string connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

// 🔹 Register DAL and BL
builder.Services.AddScoped<TablesRepository>(_ => new TablesRepository(connectionString));
builder.Services.AddScoped<TablesService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:4200") 
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();
app.UseCors();

app.UseAuthorization();

app.MapControllers();

app.Run();
