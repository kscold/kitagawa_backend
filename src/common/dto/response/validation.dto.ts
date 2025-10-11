import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 표준 API 응답 DTO
 * 모든 API 응답은 이 형식을 따릅니다
 */
export class ValidationDto<T = any> {
    @ApiProperty({
        example: true,
        description: '요청 성공 여부',
    })
    success: boolean;

    @ApiProperty({
        example: HttpStatus.OK,
        description: 'HTTP 상태 코드',
    })
    code: number;

    @ApiProperty({
        example: '요청이 성공적으로 처리되었습니다',
        description: '응답 메시지',
    })
    message: string;

    @ApiProperty({
        description: '응답 데이터',
        required: false,
    })
    data?: T;

    constructor(success: boolean, code: number, message: string, data?: T) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.data = data;
    }

    static success<T>(message: string, data?: T, code: number = HttpStatus.OK): ValidationDto<T> {
        return new ValidationDto(true, code, message, data);
    }

    static error(message: string, code: number = HttpStatus.BAD_REQUEST): ValidationDto {
        return new ValidationDto(false, code, message);
    }
}
