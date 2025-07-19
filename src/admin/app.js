import extensions from './extensions.js';
import React from 'react';

export default {
  config: {
    extensions,
  },
  bootstrap(app) {
    // Add the AI Chat menu item
    app.addMenuLink({
      to: '/ai-chat',
      icon: () => React.createElement('span', { style: { fontSize: '18px' } }, '💬'),
      intlLabel: {
        id: 'ai-chat.menu.label',
        defaultMessage: 'AI Chat',
      },
      permissions: [],
      Component: async () => {
        const { default: AiChat } = await import('./pages/AiChat/index.jsx');
        return AiChat;
      },
    });
  },
};
