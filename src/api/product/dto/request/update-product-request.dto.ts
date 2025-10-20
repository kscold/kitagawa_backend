import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateProductRequestDto } from './create-product-request.dto';

/**
 * 제품 수정 요청 DTO
 * CreateProductRequestDto의 모든 필드를 선택적으로 만듦
 */
export class UpdateProductRequestDto extends PartialType(CreateProductRequestDto) {
    @ApiPropertyOptional({ description: '제품 코드는 수정할 수 없습니다' })
    productCode?: never; // 제품 코드는 수정 불가
}
