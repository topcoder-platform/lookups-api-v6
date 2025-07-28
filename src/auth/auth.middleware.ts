import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { middleware } from 'tc-core-library-js';
const { jwtAuthenticator: authenticator } = middleware;

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private jwtAuthenticator;

  constructor(private configService: ConfigService) {
    const authSecret = this.configService.get<string>(
      'AUTH_SECRET',
      'mysecret',
    );
    let issuersValue = this.configService.get<string>(
      'VALID_ISSUERS',
      '["https://api.topcoder.com","https://topcoder-dev.auth0.com/"]',
    );

    // The tc-core-library-js authenticator expects a string that is a valid JSON array.
    // This logic ensures the value is always in the correct format.
    if (!issuersValue.trim().startsWith('[')) {
      const issuersArray = issuersValue.split(',').map((s) => s.trim());
      issuersValue = JSON.stringify(issuersArray);
    }

    this.jwtAuthenticator = authenticator({
      AUTH_SECRET: authSecret,
      VALID_ISSUERS: issuersValue,
    });
  }

  use(req: any, res: Response, next: NextFunction) {
    if (req.headers.authorization) {
      this.jwtAuthenticator(req, res, (err) => {
        if (err) {
          return next(new UnauthorizedException(err.message));
        }
        next();
      });
    } else {
      next();
    }
  }
}
