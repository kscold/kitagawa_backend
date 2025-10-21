import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateCategoryRequestDto } from './create-category-request.dto';

/**
 * 카테고리 수정 요청 DTO
 * CreateCategoryRequestDto의 모든 필드를 선택적으로 만들되, slug는 제외
 */
export class UpdateCategoryRequestDto extends PartialType(OmitType(CreateCategoryRequestDto, ['slug'] as const)) {}
