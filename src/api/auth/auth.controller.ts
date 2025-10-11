import { Controller, Post, Body, Get, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AdminJwtAuthGuard } from '../../common/guard/admin-jwt-auth.guard';

@ApiTags('Auth - Admin')
@Controller('auth-admin')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * 관리자 회원가입
     */
    @Post('register')
    @ApiOperation({ summary: '관리자 회원가입' })
    @ApiBody({
        schema: {
            properties: {
                username: { type: 'string', example: 'kitagawa' },
                password: { type: 'string', example: 'kitagawa' },
                name: { type: 'string', example: '관리자' },
            },
        },
    })
    @ApiResponse({ status: HttpStatus.CREATED, description: '회원가입 성공' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: '이미 존재하는 아이디' })
    async register(@Body('username') username: string, @Body('password') password: string, @Body('name') name: string) {
        const admin = await this.authService.register(username, password, name);

        return {
            success: true,
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
    @ApiOperation({ summary: '관리자 로그인' })
    @ApiBody({
        schema: {
            properties: {
                username: { type: 'string', example: 'kitagawa' },
                password: { type: 'string', example: 'kitagawa' },
            },
        },
    })
    @ApiResponse({ status: HttpStatus.OK, description: '로그인 성공' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
    async login(@Body('username') username: string, @Body('password') password: string) {
        const result = await this.authService.login(username, password);

        return {
            success: true,
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
    @ApiOperation({ summary: '내 정보 조회 (JWT 필요)' })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
    async getMe(@Request() req: any) {
        const admin = await this.authService.getAdminById(req.user.id);

        return {
            success: true,
            data: admin,
        };
    }

    /**
     * 모든 관리자 조회
     */
    @Get('all')
    @UseGuards(AdminJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '모든 관리자 조회 (JWT 필요)' })
    @ApiResponse({ status: HttpStatus.OK, description: '조회 성공' })
    async getAllAdmins() {
        const admins = await this.authService.getAllAdmins();

        return {
            success: true,
            count: admins.length,
            data: admins,
        };
    }
}
