import { Injectable } from '@nestjs/common';
import { NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';

import { ResponseDTO } from './response.dto';

@Injectable()
export class ResponseMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const originalSend = res.json.bind(res);
    res.json = function json(body?: any): Response {
      if (req.method === 'GET') {
        body = Array.isArray(body)
          ? body.map((item) => plainToClass(ResponseDTO, item))
          : plainToClass(ResponseDTO, body);
      }
      return originalSend({
        fromDB: true,
        result: body,
      });
    };
    next();
  }
}
