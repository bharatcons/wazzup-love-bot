// Contact Picker API types
// Based on https://developer.mozilla.org/en-US/docs/Web/API/Contact_Picker_API

interface ContactProperty {
  [key: string]: string[];
}

interface ContactsManagerSelectOptions {
  multiple?: boolean;
}

interface ContactsManager {
  select: (
    properties: string[], 
    options?: ContactsManagerSelectOptions
  ) => Promise<ContactProperty[]>;
  getProperties: () => Promise<string[]>;
}

interface ContactsNavigator extends Navigator {
  contacts?: ContactsManager;
}

// Extend Navigator interface to include contacts property
declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }

  interface Window {
    ContactsManager?: any;
  }
}

export {}; 