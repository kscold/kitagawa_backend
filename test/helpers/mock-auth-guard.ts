import { ExecutionContext } from '@nestjs/common';

/**
 * Mock Auth Guard for testing
 * Always allows requests to pass through
 */
export class MockAdminJwtAuthGuard {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        // Mock user data for requests that need it
        request.user = {
            id: 'mock-admin-id',
            username: 'testadmin',
            role: 'admin',
        };
        return true;
    }
}
