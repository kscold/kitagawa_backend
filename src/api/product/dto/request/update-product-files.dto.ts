import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FileItemDto {
    @ApiProperty({
        description: '파일 제목 (모델명)',
        example: 'BR200',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: '파일 URL (CDN URL)',
        example: 'https://cdn.example.com/files/BR200.pdf',
    })
    @IsString()
    @IsNotEmpty()
    url: string;

    @ApiProperty({
        description: '파일 타입',
        example: 'PDF',
        enum: ['PDF', 'DWG', 'DXF', 'TIF', 'STEP', 'Parasolid'],
    })
    @IsString()
    @IsNotEmpty()
    type: string;
}

export class UpdateProductFilesDto {
    @ApiProperty({
        description: '제품 자료 파일 목록',
        type: [FileItemDto],
        example: [
            {
                title: 'BR200',
                url: 'https://cdn.example.com/files/BR200.pdf',
                type: 'PDF',
            },
            {
                title: 'BR200',
                url: 'https://cdn.example.com/files/BR200.dwg',
                type: 'DWG',
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FileItemDto)
    files: FileItemDto[];
}
