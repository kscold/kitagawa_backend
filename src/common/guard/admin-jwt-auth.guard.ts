import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 관리자 JWT 인증 가드
 * Admin API 엔드포인트에서 사용
 */
@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('admin-jwt') {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            throw err || new UnauthorizedException('관리자 인증이 필요합니다');
        }
        return user;
    }
}
