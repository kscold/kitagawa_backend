import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * 관리자 JWT 전략
 * Bearer 토큰에서 JWT를 추출하고 검증
 */
@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_ADMIN_SECRET'),
        });
    }

    async validate(payload: any) {
        if (!payload || !payload.sub) {
            throw new UnauthorizedException('유효하지 않은 토큰입니다');
        }

        // payload에서 관리자 정보 반환
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role || 'admin',
        };
    }
}
