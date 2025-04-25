import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import path from 'path'
import routes from './routes'
import { initializeDb } from './utils/db'
import config from './config'

async function start() {
  const fastify = Fastify({
    logger: {
      level: config.logger.level,
      transport: config.isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  })

  await initializeDb()

  const FRONTEND_URL = process.env.FRONTEND_URL ?? config.cors.origin

  await fastify.register(cors, {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  await fastify.register(multipart, {
    limits: { fileSize: config.upload.maxFileSize },
  })

  await fastify.register(fastifyStatic, {
    root: config.storage.uploadsDir,
    prefix: '/api/files/',
    decorateReply: false,
  })

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Music Tracks API',
        description: 'API for managing music tracks',
        version: '1.0.0',
      },
    },
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  })

  await fastify.register(routes)

  await fastify.listen({
    port: config.server.port,
    host: config.server.host,
  })
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})
