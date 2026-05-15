import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'GPU Lending Platform API',
    version: '2.0.0',
    description: 'Multi-tenant GPU lending platform — production-ready REST API',
    contact: { name: 'Ayush Katuwal', email: 'katuwalayush616@gmail.com' },
  },
  servers: [
    { url: '/api/v1', description: 'Current server' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          pages: { type: 'integer' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'ORG_OWNER', 'USER'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      GPU: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          model: { type: 'string' },
          memory: { type: 'integer', description: 'VRAM in GB' },
          status: { type: 'string', enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'OFFLINE'] },
          pricingPlan: {
            type: 'object',
            properties: { name: { type: 'string' }, hourlyRate: { type: 'number' } },
          },
        },
      },
      Rental: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] },
          hourlyRate: { type: 'number' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string', minLength: 2 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered successfully' },
          '400': { description: 'Email already registered or validation error' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive access + refresh tokens',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token and get new access token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'New tokens issued' },
          '401': { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout — blacklists access token, revokes refresh token',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Logged out' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        responses: {
          '200': { description: 'User profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
        },
      },
    },
    '/gpus': {
      get: {
        tags: ['GPUs'],
        summary: 'List all GPUs with pagination and filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'OFFLINE'] } },
          { name: 'model', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Paginated GPU list' } },
      },
      post: {
        tags: ['GPUs'],
        summary: 'Create a GPU (admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['serverId', 'model', 'memory', 'computeCapability', 'pcieBusId'],
                properties: {
                  serverId: { type: 'string', format: 'uuid' },
                  model: { type: 'string' },
                  memory: { type: 'integer' },
                  computeCapability: { type: 'string' },
                  pcieBusId: { type: 'string' },
                  pricingPlanId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'GPU created' } },
      },
    },
    '/gpus/available': {
      get: {
        tags: ['GPUs'],
        summary: 'List available GPUs',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Available GPUs' } },
      },
    },
    '/gpus/{id}': {
      get: {
        tags: ['GPUs'],
        summary: 'Get GPU by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'GPU details' }, '404': { description: 'Not found' } },
      },
    },
    '/gpus/{id}/status': {
      patch: {
        tags: ['GPUs'],
        summary: 'Update GPU status (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'OFFLINE'] } },
              },
            },
          },
        },
        responses: { '200': { description: 'Status updated' } },
      },
    },
    '/gpus/pricing-plans': {
      get: {
        tags: ['GPUs'],
        summary: 'List active pricing plans (admin)',
        responses: { '200': { description: 'Pricing plans' } },
      },
      post: {
        tags: ['GPUs'],
        summary: 'Create pricing plan (admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'hourlyRate'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  hourlyRate: { type: 'number' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Plan created' } },
      },
    },
    '/rentals': {
      post: {
        tags: ['Rentals'],
        summary: 'Create a rental (atomic, auto-priced from GPU pricing plan)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  gpuId: { type: 'string', format: 'uuid' },
                  clusterId: { type: 'string', format: 'uuid' },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Rental created' },
          '409': { description: 'GPU not available' },
        },
      },
      get: {
        tags: ['Rentals'],
        summary: 'List all rentals (admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] } },
        ],
        responses: { '200': { description: 'Paginated rentals' } },
      },
    },
    '/rentals/my-rentals': {
      get: {
        tags: ['Rentals'],
        summary: "Get current user's rentals",
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'User rentals' } },
      },
    },
    '/rentals/{id}/end': {
      post: {
        tags: ['Rentals'],
        summary: 'End a rental — auto-generates invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Rental ended, invoice generated' } },
      },
    },
    '/rentals/{id}/extend': {
      post: {
        tags: ['Rentals'],
        summary: 'Extend rental end time',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['endTime'],
                properties: { endTime: { type: 'string', format: 'date-time' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Rental extended' } },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Platform statistics',
        responses: { '200': { description: 'Stats' } },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users with pagination',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'ORG_OWNER', 'USER'] } },
        ],
        responses: { '200': { description: 'Users list' } },
      },
    },
    '/admin/users/{id}/role': {
      patch: {
        tags: ['Admin'],
        summary: 'Update user role',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: { role: { type: 'string', enum: ['ADMIN', 'ORG_OWNER', 'USER'] } },
              },
            },
          },
        },
        responses: { '200': { description: 'Role updated' } },
      },
    },
    '/admin/audit-logs': {
      get: {
        tags: ['Admin'],
        summary: 'Paginated audit logs with filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Audit logs' } },
      },
    },
    '/admin/invoices': {
      get: {
        tags: ['Admin'],
        summary: 'List all invoices (admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] } },
        ],
        responses: { '200': { description: 'Invoices list' } },
      },
    },
  },
};

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'GPU Lending API' }));
};
