import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { Admin, AdminDocument } from '../../schema/admin.schema';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    /**
     * 관리자 회원가입
     */
    async register(username: string, password: string, name: string): Promise<AdminDocument> {
        // 아이디 중복 체크
        const existingAdmin = await this.adminModel.findOne({ username }).exec();
        if (existingAdmin) {
            throw new ConflictException('이미 존재하는 아이디입니다');
        }

        // 새 관리자 생성 (password는 스키마 pre-save 훅에서 자동 해싱됨)
        const admin = new this.adminModel({
            username,
            password,
            name,
            role: 'admin',
        });

        return (await admin.save()) as AdminDocument;
    }

    /**
     * 관리자 로그인
     */
    async login(username: string, password: string): Promise<{ accessToken: string; admin: any }> {
        // 관리자 찾기
        const admin: any = await this.adminModel.findOne({ username }).exec();
        if (!admin) {
            throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
        }

        // 활성 상태 확인
        if (!admin.isActive) {
            throw new UnauthorizedException('비활성화된 계정입니다');
        }

        // 비밀번호 확인
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
        }

        // 마지막 로그인 시간 업데이트
        admin.lastLoginAt = new Date();
        await admin.save();

        // JWT 토큰 생성
        const payload = {
            sub: admin._id,
            username: admin.username,
            role: admin.role,
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_ADMIN_SECRET'),
            expiresIn: '24h',
        });

        return {
            accessToken,
            admin: {
                id: admin._id,
                username: admin.username,
                name: admin.name,
                role: admin.role,
            },
        };
    }

    /**
     * 관리자 정보 조회
     */
    async getAdminById(id: string): Promise<AdminDocument | null> {
        return (await this.adminModel.findById(id).select('-password').exec()) as any;
    }

    /**
     * 모든 관리자 조회
     */
    async getAllAdmins(): Promise<AdminDocument[]> {
        return (await this.adminModel.find().select('-password').exec()) as any;
    }
}
