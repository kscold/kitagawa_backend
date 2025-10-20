import { Controller, Post, Body, Get, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AdminJwtAuthGuard } from '../../common/guard/admin-jwt-auth.guard';
import {
    RegisterResponseDto,
    LoginResponseDto,
    GetMeResponseDto,
    GetAllAdminsResponseDto,
} from './dto/response/auth-response.dto';

@ApiTags('Auth - Admin')
@Controller('auth-admin')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * 관리자 회원가입
     */
    @Post('register')
    @ApiOperation({
        summary: '관리자 회원가입',
        description: `
새로운 관리자 계정을 생성합니다.

생성 정보:
- username: 관리자 아이디 (중복 불가)
- password: 비밀번호 (암호화 저장)
- name: 관리자 이름

역할(role)은 자동으로 'admin'으로 설정됩니다.
        `,
    })
    @ApiBody({
        schema: {
            properties: {
                username: { type: 'string', example: 'kitagawa', description: '관리자 아이디' },
                password: { type: 'string', example: 'kitagawa', description: '비밀번호' },
                name: { type: 'string', example: '관리자', description: '관리자 이름' },
            },
            required: ['username', 'password', 'name'],
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '회원가입 성공',
        type: RegisterResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '관리자 계정이 생성되었습니다',
                data: {
                    id: '507f1f77bcf86cd799439011',
                    username: 'kitagawa',
                    name: '관리자',
                    role: 'admin',
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.CONFLICT,
        description: '이미 존재하는 아이디',
        schema: {
            example: {
                success: false,
                code: 409,
                message: '이미 존재하는 아이디입니다',
            },
        },
    })
    async register(@Body('username') username: string, @Body('password') password: string, @Body('name') name: string) {
        const admin = await this.authService.register(username, password, name);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '관리자 계정이 생성되었습니다',
            data: {
                id: admin._id,
                username: admin.username,
                name: admin.name,
                role: admin.role,
            },
        };
    }

    /**
     * 관리자 로그인
     */
    @Post('login')
    @ApiOperation({
        summary: '관리자 로그인',
        description: `
관리자 로그인을 수행합니다.

로그인 정보:
- username: 관리자 아이디
- password: 비밀번호

성공 시 JWT 액세스 토큰과 관리자 정보를 반환합니다.
토큰은 이후 인증이 필요한 API 요청 시 Authorization 헤더에 포함해야 합니다.
        `,
    })
    @ApiBody({
        schema: {
            properties: {
                username: { type: 'string', example: 'kitagawa', description: '관리자 아이디' },
                password: { type: 'string', example: 'kitagawa', description: '비밀번호' },
            },
            required: ['username', 'password'],
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '로그인 성공',
        type: LoginResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '로그인 성공',
                data: {
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3OGVhNWU0ZWZiOWEzNDFkZmYyZjYwOWQiLCJ1c2VybmFtZSI6ImtpdGFnYXdhIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM3Mjg4MTg0LCJleHAiOjE3MzcyOTE3ODR9.abc123def456',
                    admin: {
                        _id: '507f1f77bcf86cd799439011',
                        username: 'kitagawa',
                        name: '관리자',
                        role: 'admin',
                        createdAt: '2025-01-15T10:30:00.000Z',
                    },
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패 (아이디 또는 비밀번호 불일치)',
        schema: {
            example: {
                success: false,
                code: 401,
                message: '아이디 또는 비밀번호가 일치하지 않습니다',
            },
        },
    })
    async login(@Body('username') username: string, @Body('password') password: string) {
        const result = await this.authService.login(username, password);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '로그인 성공',
            data: {
                accessToken: result.accessToken,
                admin: result.admin,
            },
        };
    }

    /**
     * 내 정보 조회
     */
    @Get('me')
    @UseGuards(AdminJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '내 정보 조회 (JWT 필요)',
        description: `
현재 로그인한 관리자의 정보를 조회합니다.

인증:
- Authorization 헤더에 "Bearer {token}" 형식으로 JWT 토큰 필요
- 토큰은 로그인 시 받은 accessToken 사용

반환 정보:
- 관리자 기본 정보 (ID, 아이디, 이름, 역할)
- 계정 생성일
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: GetMeResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '관리자 정보 조회 성공',
                data: {
                    _id: '507f1f77bcf86cd799439011',
                    username: 'kitagawa',
                    name: '관리자',
                    role: 'admin',
                    createdAt: '2025-01-15T10:30:00.000Z',
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패 (토큰 없음, 만료, 또는 유효하지 않음)',
        schema: {
            example: {
                success: false,
                code: 401,
                message: 'Unauthorized',
            },
        },
    })
    async getMe(@Request() req: any) {
        const admin = await this.authService.getAdminById(req.user.id);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '관리자 정보 조회 성공',
            data: admin,
        };
    }

    /**
     * 모든 관리자 조회
     */
    @Get('all')
    @UseGuards(AdminJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '모든 관리자 조회 (JWT 필요)',
        description: `
시스템에 등록된 모든 관리자 목록을 조회합니다.

인증:
- Authorization 헤더에 "Bearer {token}" 형식으로 JWT 토큰 필요

반환 정보:
- 모든 관리자의 기본 정보 배열
- 비밀번호는 포함되지 않음

관리자 관리 페이지에서 사용됩니다.
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: GetAllAdminsResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '모든 관리자 조회 성공',
                data: [
                    {
                        _id: '507f1f77bcf86cd799439011',
                        username: 'kitagawa',
                        name: '관리자',
                        role: 'admin',
                        createdAt: '2025-01-15T10:30:00.000Z',
                    },
                    {
                        _id: '507f1f77bcf86cd799439012',
                        username: 'admin2',
                        name: '부관리자',
                        role: 'admin',
                        createdAt: '2025-01-16T09:00:00.000Z',
                    },
                ],
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
        schema: {
            example: {
                success: false,
                code: 401,
                message: 'Unauthorized',
            },
        },
    })
    async getAllAdmins() {
        const admins = await this.authService.getAllAdmins();

        return {
            success: true,
            code: HttpStatus.OK,
            message: '모든 관리자 조회 성공',
            data: admins,
        };
    }
}
