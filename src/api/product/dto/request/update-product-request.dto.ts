import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductRequestDto } from './create-product-request.dto';

/**
 * 제품 수정 요청 DTO
 * slug와 productCode는 수정 불가
 */
export class UpdateProductRequestDto extends PartialType(
    OmitType(CreateProductRequestDto, ['slug', 'productCode'] as const),
) {
    // slug와 productCode는 이미 OmitType으로 제외됨
}
