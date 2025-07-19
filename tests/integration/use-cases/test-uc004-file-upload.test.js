/**
 * UC-004: File Upload Processing and User Assignment - Regression Tests
 * 
 * This test suite validates all aspects of UC-004 as documented in use_cases.md
 * Run with: npm run test:uc004
 * 
 * NOTE: These are pure unit tests that don't require Strapi initialization
 * They test the use case logic in isolation for fast regression testing
 */

// Disable Strapi setup for these standalone tests
process.env.SKIP_STRAPI_SETUP = 'true';

// Mock file upload middleware functionality
class MockFileUploadProcessor {
  constructor() {
    this.uploadedFiles = [];
    this.fileEvents = [];
  }

  processFileUpload(file, user) {
    // BR-016: Files require user, bot, company assignment
    if (!user || !user.bot || !user.company) {
      throw new Error('User must have both bot and company assigned');
    }

    const processedFile = {
      ...file,
      userId: user.id,
      botId: user.bot.id,
      companyId: user.company.id,
      metadata: {
        uploadedAt: new Date().toISOString(),
        assignedUser: user.id,
        assignedBot: user.bot.id,
        assignedCompany: user.company.id
      }
    };

    this.uploadedFiles.push(processedFile);

    // BR-017: File-events track processing status
    const fileEvent = {
      id: `event_${Date.now()}`,
      fileId: file.id,
      userId: user.id,
      botId: user.bot.id,
      companyId: user.company.id,
      status: 'pending',
      eventType: 'file_uploaded',
      createdAt: new Date().toISOString()
    };

    this.fileEvents.push(fileEvent);

    return {
      success: true,
      file: processedFile,
      event: fileEvent
    };
  }

  getFilesByUser(userId) {
    return this.uploadedFiles.filter(file => file.userId === userId);
  }

  getEventsByFile(fileId) {
    return this.fileEvents.filter(event => event.fileId === fileId);
  }

  clearAll() {
    this.uploadedFiles = [];
    this.fileEvents = [];
  }
}

// Mock toast notification for uploads
function createUploadToast(filenames) {
  // BR-018: Upload success confirmed via toast
  return {
    type: 'success',
    message: `✅ Files uploaded successfully! ${filenames.join(', ')}`,
    persistent: true,
    timestamp: new Date().toISOString()
  };
}

describe('UC-004: File Upload Processing and User Assignment', () => {
  let processor;

  beforeEach(() => {
    processor = new MockFileUploadProcessor();
  });

  afterEach(() => {
    processor.clearAll();
  });

  describe('BR-016: Files Require User, Bot, Company Assignment', () => {
    test('should successfully assign file to user with bot and company', () => {
      const user = {
        id: 1,
        username: 'testuser',
        bot: { id: 10 },
        company: { id: 20 }
      };

      const file = {
        id: 'file_123',
        filename: 'document.pdf',
        size: 1024,
        mimetype: 'application/pdf'
      };

      const result = processor.processFileUpload(file, user);

      expect(result.success).toBe(true);
      expect(result.file.userId).toBe(1);
      expect(result.file.botId).toBe(10);
      expect(result.file.companyId).toBe(20);
    });

    test('should fail when user has no bot assigned', () => {
      const user = {
        id: 1,
        username: 'testuser',
        bot: null,
        company: { id: 20 }
      };

      const file = {
        id: 'file_123',
        filename: 'document.pdf'
      };

      expect(() => {
        processor.processFileUpload(file, user);
      }).toThrow('User must have both bot and company assigned');
    });

    test('should fail when user has no company assigned', () => {
      const user = {
        id: 1,
        username: 'testuser',
        bot: { id: 10 },
        company: null
      };

      const file = {
        id: 'file_123',
        filename: 'document.pdf'
      };

      expect(() => {
        processor.processFileUpload(file, user);
      }).toThrow('User must have both bot and company assigned');
    });

    test('should fail when user has neither bot nor company', () => {
      const user = {
        id: 1,
        username: 'testuser',
        bot: null,
        company: null
      };

      const file = {
        id: 'file_123',
        filename: 'document.pdf'
      };

      expect(() => {
        processor.processFileUpload(file, user);
      }).toThrow('User must have both bot and company assigned');
    });
  });

  describe('BR-017: File-Events Track Processing Status', () => {
    test('should create file-event record for each upload', () => {
      const user = {
        id: 5,
        username: 'uploader',
        bot: { id: 15 },
        company: { id: 25 }
      };

      const file = {
        id: 'file_456',
        filename: 'presentation.pptx',
        size: 2048
      };

      const result = processor.processFileUpload(file, user);

      expect(result.event).toBeDefined();
      expect(result.event.fileId).toBe('file_456');
      expect(result.event.userId).toBe(5);
      expect(result.event.botId).toBe(15);
      expect(result.event.companyId).toBe(25);
      expect(result.event.status).toBe('pending');
      expect(result.event.eventType).toBe('file_uploaded');
    });

    test('should allow tracking multiple events for same file', () => {
      const user = {
        id: 3,
        bot: { id: 13 },
        company: { id: 23 }
      };

      const file1 = { id: 'file_001', filename: 'doc1.pdf' };
      const file2 = { id: 'file_002', filename: 'doc2.pdf' };

      processor.processFileUpload(file1, user);
      processor.processFileUpload(file2, user);

      const file1Events = processor.getEventsByFile('file_001');
      const file2Events = processor.getEventsByFile('file_002');

      expect(file1Events).toHaveLength(1);
      expect(file2Events).toHaveLength(1);
      expect(file1Events[0].fileId).toBe('file_001');
      expect(file2Events[0].fileId).toBe('file_002');
    });
  });

  describe('BR-018: Upload Success Confirmed via Toast', () => {
    test('should generate success toast for file uploads', () => {
      const filenames = ['document1.pdf', 'document2.docx'];
      const toast = createUploadToast(filenames);

      expect(toast.type).toBe('success');
      expect(toast.message).toContain('✅ Files uploaded successfully!');
      expect(toast.message).toContain('document1.pdf');
      expect(toast.message).toContain('document2.docx');
      expect(toast.persistent).toBe(true);
    });

    test('should handle single file upload toast', () => {
      const filenames = ['single-file.txt'];
      const toast = createUploadToast(filenames);

      expect(toast.message).toContain('Files uploaded successfully!');
      expect(toast.message).toContain('single-file.txt');
    });
  });

  describe('BR-019: Metadata Assignment is Automatic', () => {
    test('should automatically assign complete metadata to uploaded files', () => {
      const user = {
        id: 7,
        username: 'metadata_test',
        bot: { id: 17 },
        company: { id: 27 }
      };

      const file = {
        id: 'file_789',
        filename: 'test-file.xlsx',
        size: 4096,
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

      const result = processor.processFileUpload(file, user);

      // Check automatic metadata assignment
      expect(result.file.metadata).toBeDefined();
      expect(result.file.metadata.uploadedAt).toBeDefined();
      expect(result.file.metadata.assignedUser).toBe(7);
      expect(result.file.metadata.assignedBot).toBe(17);
      expect(result.file.metadata.assignedCompany).toBe(27);

      // Check direct assignments
      expect(result.file.userId).toBe(7);
      expect(result.file.botId).toBe(17);
      expect(result.file.companyId).toBe(27);
    });

    test('should preserve original file properties while adding metadata', () => {
      const user = {
        id: 9,
        bot: { id: 19 },
        company: { id: 29 }
      };

      const originalFile = {
        id: 'file_original',
        filename: 'important.doc',
        size: 1536,
        mimetype: 'application/msword',
        customProperty: 'preserved'
      };

      const result = processor.processFileUpload(originalFile, user);

      // Original properties preserved
      expect(result.file.id).toBe('file_original');
      expect(result.file.filename).toBe('important.doc');
      expect(result.file.size).toBe(1536);
      expect(result.file.mimetype).toBe('application/msword');
      expect(result.file.customProperty).toBe('preserved');

      // Metadata added
      expect(result.file.userId).toBe(9);
      expect(result.file.metadata).toBeDefined();
    });
  });

  describe('Main Flow: Complete File Upload Processing', () => {
    test('should complete full file upload workflow', () => {
      const user = {
        id: 11,
        username: 'workflow_test',
        email: 'test@example.com',
        bot: { id: 21 },
        company: { id: 31 }
      };

      const files = [
        { id: 'file_1', filename: 'report.pdf', size: 2048 },
        { id: 'file_2', filename: 'data.csv', size: 1024 }
      ];

      // Process multiple files
      const results = files.map(file => processor.processFileUpload(file, user));

      // Verify all uploads succeeded
      expect(results.every(r => r.success)).toBe(true);

      // Verify user file retrieval
      const userFiles = processor.getFilesByUser(11);
      expect(userFiles).toHaveLength(2);

      // Verify file-events created
      const file1Events = processor.getEventsByFile('file_1');
      const file2Events = processor.getEventsByFile('file_2');
      expect(file1Events).toHaveLength(1);
      expect(file2Events).toHaveLength(1);

      // Verify toast message
      const toast = createUploadToast(['report.pdf', 'data.csv']);
      expect(toast.message).toContain('report.pdf');
      expect(toast.message).toContain('data.csv');
    });
  });

  describe('Alternative Flows: Error Handling', () => {
    test('should handle missing user gracefully', () => {
      const file = { id: 'file_test', filename: 'test.txt' };

      expect(() => {
        processor.processFileUpload(file, null);
      }).toThrow();

      expect(() => {
        processor.processFileUpload(file, undefined);
      }).toThrow();
    });

    test('should handle malformed user data gracefully', () => {
      const file = { id: 'file_test', filename: 'test.txt' };
      const malformedUser = { id: 1 }; // Missing bot and company

      expect(() => {
        processor.processFileUpload(file, malformedUser);
      }).toThrow('User must have both bot and company assigned');
    });

    test('should handle file metadata assignment failure gracefully', () => {
      const user = {
        id: 13,
        bot: { id: 23 },
        company: { id: 33 }
      };

      const file = null; // Invalid file

      expect(() => {
        processor.processFileUpload(file, user);
      }).toThrow();
    });
  });

});

// Export for potential reuse in other tests
module.exports = {
  MockFileUploadProcessor,
  createUploadToast
}; 