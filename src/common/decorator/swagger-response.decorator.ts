import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiResponseOptions } from '@nestjs/swagger';

export function SwaggerResponse(options: ApiResponseOptions) {
    return applyDecorators(ApiResponse(options));
}
