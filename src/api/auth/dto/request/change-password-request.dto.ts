import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordRequestDto {
    @ApiProperty({
        description: '현재 비밀번호',
        example: 'currentPassword123',
    })
    @IsString()
    @IsNotEmpty({ message: '현재 비밀번호를 입력해주세요' })
    currentPassword: string;

    @ApiProperty({
        description: '새 비밀번호',
        example: 'newPassword456',
    })
    @IsString()
    @IsNotEmpty({ message: '새 비밀번호를 입력해주세요' })
    @MinLength(4, { message: '비밀번호는 최소 4자 이상이어야 합니다' })
    newPassword: string;
}
