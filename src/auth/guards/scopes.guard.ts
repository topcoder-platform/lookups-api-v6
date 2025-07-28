import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredScopes) {
      return true; // No scopes are required, access is granted.
    }
    const { user } = context.switchToHttp().getRequest();
    // Check if the user's scopes array contains any of the required scopes.
    return requiredScopes.some((scope) => user.scopes?.includes(scope));
  }
}
