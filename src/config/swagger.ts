// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Xenia API Documentation',
            version: '1.0.0',
            description: 'Complete API documentation for Xenia Backend',
            contact: {
                name: 'Xenia Team',
                email: 'support@xenia.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
            {
                url: 'https://xenia-26-server.vercel.app',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-secret-key',
                    description: 'Secret key for API authentication',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['name', 'email', 'password'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Auto-generated user ID',
                            example: '507f1f77bcf86cd799439011',
                        },
                        name: {
                            type: 'string',
                            description: 'User full name',
                            example: 'John Doe',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                            example: 'john@example.com',
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            description: 'User password (hashed)',
                            example: 'securepass123',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Timestamp of user creation',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Timestamp of last update',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        error: {
                            type: 'string',
                            example: 'Error message',
                        },
                        message: {
                            type: 'string',
                            example: 'Detailed error description',
                        },
                    },
                },
                HealthCheck: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'healthy',
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                        },
                        uptime: {
                            type: 'number',
                            example: 12345.67,
                        },
                        services: {
                            type: 'object',
                            properties: {
                                database: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'string',
                                            example: 'connected',
                                        },
                                        responseTime: {
                                            type: 'number',
                                            example: 45,
                                        },
                                    },
                                },
                                redis: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'string',
                                            example: 'connected',
                                        },
                                        responseTime: {
                                            type: 'number',
                                            example: 12,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                ApiKeyAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to files with annotations
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
