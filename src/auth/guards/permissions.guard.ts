import { auth } from 'tc-core-library-js';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

/** Allows configured member roles or exact service scopes from the shared verified principal. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /** Evaluates context metadata; returns access or throws Unauthorized/ForbiddenException. */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredScopes) {
      return true;
    }

    const { authUser } = context.switchToHttp().getRequest();

    if (!authUser) {
      throw new UnauthorizedException('You are not authenticated.');
    }

    if (authUser.kind === 'user' && requiredRoles && authUser.roles?.length) {
      const hasRole = requiredRoles.some((role) =>
        authUser.roles.includes(role),
      );
      if (hasRole) return true;
    }

    if (requiredScopes?.length && auth.hasScopes(authUser, requiredScopes, 'any')) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have the required permissions to access this resource.',
    );
  }
}
