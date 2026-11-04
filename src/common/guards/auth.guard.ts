import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader=request.headers.authorization
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        throw new UnauthorizedException
    }
    const clientId=authHeader.split(' ')[1]
    request.clientId=clientId;
    return true;
  }
}