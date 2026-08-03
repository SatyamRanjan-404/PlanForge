const CoordinatorService = require('../agents/coordinator');

describe('Coordinator Service Smoke Test', () => {
    it('should export the singleton correctly without syntax explosions', () => {
        expect(CoordinatorService).toBeDefined();
        expect(typeof CoordinatorService.dispatchTask).toBe('function');
    });
});
