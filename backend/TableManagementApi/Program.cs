using DotNetEnv;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TableManagementBl.BusinessObjects;
using TableManagementDal.DataObjects;
using System;

var builder = WebApplication.CreateBuilder(args);

Env.Load();

string connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

// 🔹 Register DAL and BL
builder.Services.AddScoped<tablesDo>(_ => new tablesDo(connectionString));
builder.Services.AddScoped<columnsDo>(_ => new columnsDo(connectionString)); // עדיין דרוש ל-TablesBo
builder.Services.AddScoped<TablesBo>();

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
