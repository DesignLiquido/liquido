import type { Config } from '@jest/types';
export default async (): Promise<Config.InitialOptions> => {
	return {
		setupFiles: ['dotenv/config'],
        verbose: true,
        modulePathIgnorePatterns: ['<rootDir>/dist/'],
        preset: 'ts-jest',
        testEnvironment: 'node',
        coverageReporters: ['json-summary', 'lcov', 'text', 'text-summary'],
        testTimeout: 30000,
		displayName: {
			name: 'liquido',
			color: 'greenBright'
		},
		detectOpenHandles: true,
        moduleNameMapper: {
            '@designliquido/delegua-interface-grafica': '<rootDir>/testes/__mocks__/delegua-interface-grafica.ts'
        },
    };
};
