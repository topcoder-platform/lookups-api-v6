import { auth } from 'tc-core-library-js';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

/** Evaluates exact any-of scopes on the shared principal for scope-protected routes. */
@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /** Evaluates route metadata for context; returns access, throws only on invalid metadata. */
  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredScopes) {
      return true; // No scopes are required, access is granted.
    }
    const { authUser } = context.switchToHttp().getRequest();
    // Only the shared verified service principal can satisfy machine scopes.
    return requiredScopes.length > 0 && auth.hasScopes(authUser, requiredScopes, 'any');
  }
}
