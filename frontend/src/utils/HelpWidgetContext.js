import { createContext } from 'react';

export const HelpWidgetContext = createContext({
    isHelpWidgetHidden: false,
    setIsHelpWidgetHidden: () => {}
});
