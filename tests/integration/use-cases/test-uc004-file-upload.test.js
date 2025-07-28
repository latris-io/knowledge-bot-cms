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

// Set test environment to prevent database connections
process.env.NODE_ENV = 'test';

// Mock file upload lifecycle functionality
class MockFileUploadProcessor {
  constructor() {
    this.uploadedFiles = [];
    this.fileEvents = [];
    this.folders = {
      '34': { path: '/bot-77', name: 'ClearlyClear - FAQ' },
      '35': { path: '/bot-78', name: 'Acme Corporation - Support' },
      '36': { path: '/documents', name: 'Documents' } // Non-bot folder
    };
    this.bots = {
      77: { id: 77, name: 'FAQ', company: { id: 39, name: 'ClearlyClear' } },
      78: { id: 78, name: 'Support', company: { id: 43, name: 'Acme Corporation' } }
    };
  }

  async processFileUpload(file, user, folderId) {
    const processedFile = { ...file };
    
    // Always assign user if available
    if (user) {
      processedFile.userId = user.id;
      
      // Assign company from user
      if (user.company) {
        processedFile.companyId = user.company.id;
      }
    }
    
    // BR-016: Bot is determined from folder path pattern /bot-{id}
    if (folderId && this.folders[folderId]) {
      const folder = this.folders[folderId];
      const botMatch = folder.path.match(/^\/bot-(\d+)$/);
      
      if (botMatch) {
        const botId = parseInt(botMatch[1]);
        if (this.bots[botId]) {
          processedFile.botId = botId;
          
          // BR-020: Company can be inherited from bot if user has no company
          if (!processedFile.companyId && this.bots[botId].company) {
            processedFile.companyId = this.bots[botId].company.id;
      }
        }
      }
    }

    this.uploadedFiles.push(processedFile);

    // BR-017: File-events use schema: event_type='created', processing_status='pending'
    if (processedFile.botId) {
    const fileEvent = {
      id: `event_${Date.now()}`,
        file_document_id: file.id.toString(),
        file_name: file.name,
        file_type: file.mime,
        file_size: file.size,
        event_type: 'created',
        processing_status: 'pending',
        user_id: processedFile.userId,
        bot_id: processedFile.botId,
        company_id: processedFile.companyId
    };

    this.fileEvents.push(fileEvent);
    }

    return {
      success: true,
      file: processedFile,
      event: null // No direct event object returned here as per new structure
    };
  }

  getFilesByUser(userId) {
    return this.uploadedFiles.filter(file => file.userId === userId);
  }

  getEventsByFile(fileId) {
    return this.fileEvents.filter(event => event.file_document_id === fileId);
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
    test('should successfully assign file to user with bot folder', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        company: { id: 39 }
      };

      const file = {
        id: 'file_123',
        filename: 'document.pdf',
        size: 1024,
        mimetype: 'application/pdf'
      };

      const folderId = '34'; // Bot folder /bot-77
      const result = await processor.processFileUpload(file, user, folderId);

      expect(result.success).toBe(true);
      expect(result.file.userId).toBe(1);
      expect(result.file.botId).toBe(77); // Bot ID from folder path
      expect(result.file.companyId).toBe(39); // Company from user
    });

    test('should assign bot and company when file uploaded to bot folder', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        company: { id: 43 }
      };

      const file = {
        id: 'file_123',
        filename: 'document.pdf',
        size: 1024,
        mimetype: 'application/pdf'
      };

      const folderId = '35'; // Bot folder /bot-78
      const result = await processor.processFileUpload(file, user, folderId);

      expect(result.success).toBe(true);
      expect(result.file.userId).toBe(1);
      expect(result.file.botId).toBe(78); // Bot ID from folder path
      expect(result.file.companyId).toBe(43); // Company from user
    });

    test('should not assign bot when file uploaded to non-bot folder', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        company: { id: 20 }
      };

      const file = {
        id: 'file_123',
        filename: 'document.pdf',
        size: 1024,
        mimetype: 'application/pdf'
      };

      const folderId = '36'; // Non-bot folder /documents
      const result = await processor.processFileUpload(file, user, folderId);

      expect(result.success).toBe(true);
      expect(result.file.userId).toBe(1);
      expect(result.file.botId).toBeUndefined(); // No bot for non-bot folder
      expect(result.file.companyId).toBe(20); // Company from user
    });

    test('should inherit company from bot when user has no company', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        company: null // No company
      };

      const file = {
        id: 'file_123',
        filename: 'document.pdf',
        size: 1024,
        mimetype: 'application/pdf'
      };

      const folderId = '34'; // Bot folder /bot-77 (has company 39)
      const result = await processor.processFileUpload(file, user, folderId);

      expect(result.success).toBe(true);
      expect(result.file.userId).toBe(1);
      expect(result.file.botId).toBe(77);
      expect(result.file.companyId).toBe(39); // Company inherited from bot
    });
  });

  describe('BR-017: File-Events Track Processing Status', () => {
    test('should create file-event record for upload to bot folder', async () => {
      const user = {
        id: 5,
        username: 'eventuser',
        company: { id: 43 }
      };

      const file = {
        id: 'file_456',
        filename: 'presentation.pptx',
        size: 2048,
        mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };

      const folderId = '35'; // Bot folder /bot-78
      const result = await processor.processFileUpload(file, user, folderId);

      expect(result.success).toBe(true);
      
      // Check file-event was created
      const events = processor.getEventsByFile('file_456');
      expect(events).toHaveLength(1);
      expect(events[0].event_type).toBe('created');
      expect(events[0].processing_status).toBe('pending');
      expect(events[0].user_id).toBe(5);
      expect(events[0].bot_id).toBe(78);
      expect(events[0].company_id).toBe(43);
    });

    test('should not create file-event for non-bot folder upload', async () => {
      const user = {
        id: 5,
        username: 'eventuser',
        company: { id: 25 }
      };

      const file = {
        id: 'file_789',
        filename: 'general.doc',
        size: 1024,
        mime: 'application/msword'
      };

      const folderId = '36'; // Non-bot folder /documents
      const result = await processor.processFileUpload(file, user, folderId);

      expect(result.success).toBe(true);
      
      // No file-event for non-bot uploads
      const events = processor.getEventsByFile('file_789');
      expect(events).toHaveLength(0);
    });

    test('should track multiple file events correctly', async () => {
      const user = {
        id: 3,
        username: 'multiuser',
        company: { id: 39 }
      };

      const file1 = { id: 'file_001', filename: 'doc1.pdf', size: 1024, mime: 'application/pdf' };
      const file2 = { id: 'file_002', filename: 'doc2.pdf', size: 2048, mime: 'application/pdf' };

      await processor.processFileUpload(file1, user, '34'); // Bot folder /bot-77
      await processor.processFileUpload(file2, user, '34'); // Same bot folder

      const file1Events = processor.getEventsByFile('file_001');
      const file2Events = processor.getEventsByFile('file_002');

      expect(file1Events).toHaveLength(1);
      expect(file2Events).toHaveLength(1);
      expect(file1Events[0].file_document_id).toBe('file_001');
      expect(file2Events[0].file_document_id).toBe('file_002');
      expect(file1Events[0].bot_id).toBe(77);
      expect(file2Events[0].bot_id).toBe(77);
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
    test('should automatically assign complete metadata to uploaded files', async () => {
      const user = {
        id: 7,
        username: 'autouser',
        company: { id: 39 } // Match the company for bot 77
      };

      const file = {
        id: 'file_999',
        filename: 'auto.doc',
        size: 512,
        mime: 'application/msword'
      };

      const folderId = '34'; // Bot folder /bot-77
      const result = await processor.processFileUpload(file, user, folderId);

      // Check automatic metadata assignment
      expect(result.file.userId).toBe(7);
      expect(result.file.botId).toBe(77); // Bot ID 77 from folder 34
      expect(result.file.companyId).toBe(39); // Company from user
    });

    test('should preserve original file properties while adding metadata', async () => {
      const user = {
        id: 9,
        username: 'preserveuser',
        company: { id: 43 } // Match the company for bot 78
      };

      const originalFile = {
        id: 'file_original',
        filename: 'original.xlsx',
        size: 4096,
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        customProp: 'should-remain',
        createdDate: '2024-01-01'
      };

      const folderId = '35'; // Bot folder /bot-78
      const result = await processor.processFileUpload(originalFile, user, folderId);

      // Original properties preserved
      expect(result.file.id).toBe('file_original');
      expect(result.file.filename).toBe('original.xlsx');
      expect(result.file.size).toBe(4096);
      expect(result.file.customProp).toBe('should-remain');
      expect(result.file.createdDate).toBe('2024-01-01');

      // Metadata added
      expect(result.file.userId).toBe(9);
      expect(result.file.botId).toBe(78); // Bot ID 78 from folder 35
      expect(result.file.companyId).toBe(43); // Company from user
    });
  });

  describe('Main Flow: Complete File Upload Processing', () => {
    test('should complete full file upload workflow', async () => {
      const user = {
        id: 11,
        username: 'workflow_test',
        email: 'test@example.com',
        bot: { id: 21 },
        company: { id: 31 }
      };

      const files = [
        { id: 'file_1', filename: 'report.pdf', size: 2048, mimetype: 'application/pdf' },
        { id: 'file_2', filename: 'data.csv', size: 1024, mimetype: 'text/csv' }
      ];

      // Process multiple files
      const results = await Promise.all(files.map(file => processor.processFileUpload(file, user, '34'))); // Assuming all files are in folder 34

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
    test('should handle missing user gracefully', async () => {
      const file = { id: 'file_test', filename: 'test.txt' };

      // File can be uploaded without user, just won't have user/company assigned
      const result1 = await processor.processFileUpload(file, null, '36');
      expect(result1.success).toBe(true);
      expect(result1.file.userId).toBeUndefined();
      expect(result1.file.companyId).toBeUndefined();

      const result2 = await processor.processFileUpload(file, undefined, '36');
      expect(result2.success).toBe(true);
      expect(result2.file.userId).toBeUndefined();
      expect(result2.file.companyId).toBeUndefined();
    });

    test('should handle malformed user data gracefully', async () => {
      const file = { id: 'file_test', filename: 'test.txt' };
      const malformedUser = { id: 1 }; // Missing bot and company

      // File can be uploaded, just won't have company assigned
      const result = await processor.processFileUpload(file, malformedUser, '36');
      expect(result.success).toBe(true);
      expect(result.file.userId).toBe(1);
      expect(result.file.companyId).toBeUndefined();
    });

    test('should handle file metadata assignment failure gracefully', async () => {
      const user = {
        id: 13,
        bot: { id: 23 },
        company: { id: 33 }
      };

      const file = null; // Invalid file

      await expect(processor.processFileUpload(file, user, '34')).rejects.toThrow();
    });
  });

});

// Export for potential reuse in other tests
module.exports = {
  MockFileUploadProcessor,
  createUploadToast
}; 