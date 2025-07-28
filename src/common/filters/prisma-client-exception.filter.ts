import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      // P2002: Unique constraint failed
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[])?.join(', ');
        response.status(status).json({
          statusCode: status,
          message: `Conflict: A record with the same unique value for field(s): [${target}] already exists.`,
        });
        break;
      }
      // P2025: Record to update or delete does not exist
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message:
            'Record not found. The requested resource could not be found to perform the operation.',
        });
        break;
      }
      default:
        // For all other Prisma errors, fall back to the default NestJS exception filter
        super.catch(exception, host);
        break;
    }
  }
}
