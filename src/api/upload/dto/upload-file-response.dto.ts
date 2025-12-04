import { ApiProperty } from '@nestjs/swagger';

import { StandardResponseDto } from '../../../common/dto/response/standard-response.dto';

/**
 * 파일 업로드 결과 DTO
 */
export class UploadFileResultDto {
    @ApiProperty({
        example: 'https://storage.googleapis.com/kitagawa-cdn/product/1234567890-sample.jpg',
        description: '업로드된 파일의 공개 URL',
    })
    url: string;

    @ApiProperty({
        example: 'product/1234567890-sample.jpg',
        description: '파일 경로',
    })
    path: string;

    @ApiProperty({
        example: 'product',
        description: '파일이 저장된 폴더',
    })
    folder: string;

    @ApiProperty({
        example: '1234567890-sample.jpg',
        description: '저장된 파일명',
    })
    fileName: string;
}

/**
 * 파일 업로드 응답
 */
export class UploadFileResponseDto extends StandardResponseDto<UploadFileResultDto> {
    @ApiProperty({
        example: true,
        description: '요청 성공 여부',
    })
    success: boolean;

    @ApiProperty({
        example: 200,
        description: 'HTTP 상태 코드',
    })
    code: number;

    @ApiProperty({
        example: '파일 업로드 성공',
        description: '응답 메시지',
    })
    message: string;

    @ApiProperty({
        type: UploadFileResultDto,
        description: '업로드된 파일 정보',
    })
    data: UploadFileResultDto;
}
