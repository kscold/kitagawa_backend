import { PartialType } from '@nestjs/swagger';

import { ResourceAdminCreateRequestDto } from './resource-admin-create-request.dto';

/**
 * 자료 수정 요청 DTO
 * 모든 필드가 선택적
 */
export class ResourceAdminUpdateRequestDto extends PartialType(ResourceAdminCreateRequestDto) {}
