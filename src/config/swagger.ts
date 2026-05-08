import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'GPU Lending Platform API',
    version: '1.0.0',
    description: 'Multi-tenant GPU lending platform with comprehensive backend'
  },
  servers: [
    { url: 'http://localhost:3000/api/v1', description: 'Development' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'User registered' } }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Login successful' } }
      }
    },
    '/gpus': {
      get: {
        tags: ['GPUs'],
        summary: 'Get all GPUs',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'List of GPUs' } }
      }
    },
    '/rentals': {
      post: {
        tags: ['Rentals'],
        summary: 'Create rental',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Rental created' } }
      }
    }
  }
};

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
