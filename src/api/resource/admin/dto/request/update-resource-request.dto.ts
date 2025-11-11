import { PartialType } from '@nestjs/swagger';

import { CreateResourceRequestDto } from './create-resource-request.dto';

/**
 * 자료 수정 요청 DTO
 * 모든 필드가 선택적
 */
export class UpdateResourceRequestDto extends PartialType(CreateResourceRequestDto) {}
