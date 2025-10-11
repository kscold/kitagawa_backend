import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 관리자 정보 추출 데코레이터
 * AdminJwtAuthGuard를 통해 인증된 관리자 정보를 가져옵니다
 *
 * @example
 * async createProduct(@GetAdmin() admin: any) {
 *   console.log(admin.id, admin.email, admin.role);
 * }
 */
export const GetAdmin = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // AdminJwtStrategy에서 설정한 user 정보
});
