import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateProductRequestDto } from './create-product-request.dto';

/**
 * 제품 수정 요청 DTO
 * slug는 수정 불가 (URL slug로 사용되므로)
 */
export class UpdateProductRequestDto extends PartialType(OmitType(CreateProductRequestDto, ['slug'] as const)) {
    // slug는 이미 OmitType으로 제외됨
}
