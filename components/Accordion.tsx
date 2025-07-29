
import React, { useState, createContext, useContext } from 'react';
import { ChevronDownIcon } from './icons';

type AccordionContextType = {
  openItems: string[];
  toggleItem: (value: string) => void;
};

const AccordionContext = createContext<AccordionContextType | null>(null);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an Accordion component');
  }
  return context;
};

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
}

export const Accordion: React.FC<AccordionProps> = ({ children, type = 'single', defaultValue = [] }) => {
  const [openItems, setOpenItems] = useState<string[]>(
    Array.isArray(defaultValue) ? defaultValue : [defaultValue]
  );

  const toggleItem = (value: string) => {
    if (type === 'single') {
      setOpenItems(openItems.includes(value) ? [] : [value]);
    } else {
      setOpenItems(prev =>
        prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
      );
    }
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  title: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ children, value, title }) => {
  const { openItems, toggleItem } = useAccordion();
  const isOpen = openItems.includes(value);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <h3 className="text-md font-semibold">
        <button
          onClick={() => toggleItem(value)}
          className="flex w-full items-center justify-between p-4 text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
          aria-expanded={isOpen}
          aria-controls={`accordion-content-${value}`}
        >
          <span>{title}</span>
          <ChevronDownIcon
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      <div
        id={`accordion-content-${value}`}
        role="region"
        aria-labelledby={`accordion-title-${value}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
};
