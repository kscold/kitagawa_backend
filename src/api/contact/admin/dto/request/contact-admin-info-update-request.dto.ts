import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Location DTO
 */
export class LocationInfoDto {
    @ApiPropertyOptional({ description: 'Location name', example: 'Headquarters' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        description: 'Location type',
        example: 'headquarters',
        enum: ['headquarters', 'service_center', 'factory'],
    })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ description: 'Address', example: 'Seoul Geumcheon-gu' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ description: 'Phone', example: '02-2026-2222' })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ description: 'Fax', example: '02-2026-2223' })
    @IsString()
    @IsOptional()
    fax?: string;

    @ApiPropertyOptional({
        description: 'Map coordinates',
        example: { lat: 37.4812845, lng: 126.8821449 },
    })
    @IsOptional()
    coordinates?: {
        lat: number;
        lng: number;
    };
}

/**
 * Update Contact Info Request DTO
 */
export class ContactAdminInfoUpdateRequestDto {
    @ApiPropertyOptional({ description: 'Company name', example: 'Korea Kitagawa Co., Ltd.' })
    @IsString()
    @IsOptional()
    companyName?: string;

    @ApiPropertyOptional({ description: 'CEO name', example: 'Choi Min-hyung' })
    @IsString()
    @IsOptional()
    ceo?: string;

    @ApiPropertyOptional({ description: 'Headquarters address', example: 'Seoul Geumcheon-gu' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ description: 'Main phone', example: '02-2026-2222' })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ description: 'Mobile phone', example: '010-3616-9973' })
    @IsString()
    @IsOptional()
    mobile?: string;

    @ApiPropertyOptional({ description: 'Fax', example: '02-2026-2223' })
    @IsString()
    @IsOptional()
    fax?: string;

    @ApiPropertyOptional({ description: 'Email', example: 'kiw@kitagawa.co.kr' })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({ description: 'Website', example: 'https://www.kitagawa.co.kr' })
    @IsString()
    @IsOptional()
    website?: string;

    @ApiPropertyOptional({ description: 'Locations list', type: [LocationInfoDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LocationInfoDto)
    @IsOptional()
    locations?: LocationInfoDto[];
}
