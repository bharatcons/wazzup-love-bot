
import React from "react";
import { MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Header: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <header className="bg-whatsapp py-3 px-4 md:py-4 md:px-6 shadow-md sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-white mr-2 md:mr-3" />
          <h1 className="text-lg md:text-2xl font-bold text-white">{isMobile ? "WhatsApp Auto" : "WhatsApp Reminder Auto"}</h1>
        </div>
        <div className="text-xs md:text-sm text-white opacity-75">
          Auto-Messaging
        </div>
      </div>
    </header>
  );
};

export default Header;
