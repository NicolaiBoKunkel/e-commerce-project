# The project
This project focuses on developing an E-Commerce Platform, using a distributed microservice architecture. The system allows users to browse products, add them to their cart, complete orders and receive notifications. Separate users with admin privileges will be able to manage products and monitoring orders.


# Functional requirements:
User registration and admin roles
Product catalog with crud operations
Management of shopping cart
# Non-functional requirements:
Scalability: Microservice-based architecture and containerized deployment.
Security: JWT-based authentication and role based access(Admin - customer)

# Tech stack
Next.js with TypeScript
Node.js
MongoDB
PostgreSQL
Redis
REST and GraphQL for API communications
Docker and Kubernetes for deployment

# Setup

This is a guide on how to set up my project in a development environment with Docker 
Compose. 
1. Clone the repository from github: 
https://github.com/NicolaiBoKunkel/e-commerace-project - 
This can be done by running: git clone 
https://github.com/NicolaiBoKunkel/e-commerace-project.git 
2. Afterwards you have to run the “npm ci” command inside every microservice 
directory and the api-gateway and app/frontend directory. The services are all 
contained within a services folder, while the api-gateway folder is located in the 
project root as seen here: 
3. Once successfully done you can launch the frontend by running “npm run dev” from 
inside the “app/frontend directory” and visit it at “localhost:3000” in your browser. 
4. Afterwards you can launch the entire backend by running “docker-compose up –build” from the project root directory. This will launch: - 
Every microservice - - - - - 
PostgreSQL 
MongoDB 
Redis 
RabbitMQ 
The API-Gateway 
All services communicate over a shared Docker network. Data is persisted using Docker 
volumes like “postgre-data”, “mongo-data” and “redis-data”. 
5. If successful, you can now interact with the project and all functionality like user 
registration, product management and order placement. 