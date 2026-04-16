
import { describe, it, expect, vi } from 'vitest';
// We need to mock auth and prisma for material-actions
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    assignment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb({
      assignment: { upsert: vi.fn() },
      question: { deleteMany: vi.fn(), createMany: vi.fn() }
    })),
  },
}));

// Import the module after mocking
// Since we want to test generateMaterialThumbnail, but it might not be exported.
// Let's check the file content again.
import * as actions from '../material-actions';

describe('Material Actions (Units)', () => {
  it('should have a getMyAssignments function', () => {
    expect(actions.getMyAssignments).toBeDefined();
  });

  it('should have a deleteMaterial function', () => {
    expect(actions.deleteMaterial).toBeDefined();
  });

  describe('generateMaterialThumbnail', () => {
    it('should generate a DiceBear URL based on title and questions', async () => {
      const assignment = { title: 'Test Math', subject: 'Toán học' };
      const questions = [{ content: { questionText: 'What is 1+1?' } }];
      const url = await actions.generateMaterialThumbnail(assignment, questions);
      
      expect(url).toContain('api.dicebear.com');
      expect(url).toContain('seed=');
      // Subject "Toán học" should set rowColor to 3b82f6
      expect(url).toContain('rowColor=3b82f6');
    });

    it('should use default blue color for unknown subjects', async () => {
      const assignment = { title: 'Random', subject: 'Unknown' };
      const url = await actions.generateMaterialThumbnail(assignment, []);
      // Default color is 2563eb
      expect(url).toContain('rowColor=2563eb');
    });
  });
});
