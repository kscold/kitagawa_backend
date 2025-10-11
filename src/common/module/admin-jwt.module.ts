import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AdminJwtStrategy } from '../strategy/admin-jwt.strategy';

/**
 * 관리자 JWT 인증 모듈
 * 관리자 API에서 사용하는 JWT 인증 설정
 */
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'admin-jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_ADMIN_SECRET'),
                signOptions: {
                    expiresIn: '24h', // 관리자 토큰 유효기간 24시간
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AdminJwtStrategy],
    exports: [JwtModule, PassportModule],
})
export class AdminJwtModule {}
