var builder = DistributedApplication.CreateBuilder(args);

// Base de Datos Postgres en Contenedor
var postgres = builder.AddPostgres("postgres-db")
                      .WithImage("postgres", "15-alpine")
                      .WithPort(5432)
                      .AddDatabase("finca_lodana");

// Servidor Backend Express (NodeJS)
var backend = builder.AddNpmApp("backend", "../../backend-vinculacion", "dev")
                     .WithReference(postgres)
                     .WithHttpEndpoint(port: 3000, targetPort: 3000, name: "http")
                     .WithEnvironment("PORT", "3000")
                     .WithEnvironment("NODE_ENV", "development");

// Servidor Frontend Next.js (NodeJS)
var frontend = builder.AddNpmApp("frontend", "../../fronted-vinculacion", "dev")
                      .WithReference(backend)
                      .WithHttpEndpoint(port: 3001, targetPort: 3001, name: "http")
                      .WithEnvironment("PORT", "3001")
                      .WithEnvironment("NODE_ENV", "development");

builder.Build().Run();
