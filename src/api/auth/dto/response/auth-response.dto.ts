import { ApiProperty } from '@nestjs/swagger';

import { StandardResponseDto, CreatedResponseDto } from '../../../../common/dto/response/standard-response.dto';

/**
 * 관리자 기본 정보 DTO
 */
export class AdminDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: '관리자 ID',
    })
    _id: string;

    @ApiProperty({
        example: 'kitagawa',
        description: '관리자 아이디',
    })
    username: string;

    @ApiProperty({
        example: '관리자',
        description: '관리자 이름',
    })
    name: string;

    @ApiProperty({
        example: 'admin',
        description: '관리자 역할',
    })
    role: string;

    @ApiProperty({
        example: '2025-01-15T10:30:00.000Z',
        description: '생성일',
    })
    createdAt: Date;
}

/**
 * 로그인 결과 DTO
 */
export class LoginDataDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'JWT 액세스 토큰',
    })
    accessToken: string;

    @ApiProperty({
        type: AdminDto,
        description: '관리자 정보',
    })
    admin: AdminDto;
}

/**
 * 회원가입 결과 DTO
 */
export class RegisterDataDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: '생성된 관리자 ID',
    })
    id: string;

    @ApiProperty({
        example: 'kitagawa',
        description: '관리자 아이디',
    })
    username: string;

    @ApiProperty({
        example: '관리자',
        description: '관리자 이름',
    })
    name: string;

    @ApiProperty({
        example: 'admin',
        description: '관리자 역할',
    })
    role: string;
}

/**
 * 회원가입 응답
 */
export class RegisterResponseDto extends CreatedResponseDto<RegisterDataDto> {
    @ApiProperty({
        example: true,
        description: '요청 성공 여부',
    })
    success: boolean;

    @ApiProperty({
        example: 201,
        description: 'HTTP 상태 코드',
    })
    code: number;

    @ApiProperty({
        example: '관리자 계정이 생성되었습니다',
        description: '응답 메시지',
    })
    message: string;

    @ApiProperty({
        type: RegisterDataDto,
        description: '생성된 관리자 정보',
    })
    data: RegisterDataDto;
}
