
import React from "react";
import { MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Header: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <header className="bg-whatsapp py-4 px-6 shadow-md">
      <div className="max-w-4xl mx-auto flex items-center">
        <MessageSquare className="h-8 w-8 text-white mr-3" />
        <h1 className="text-xl md:text-2xl font-bold text-white">{isMobile ? "WhatsApp Auto" : "WhatsApp Reminder Auto"}</h1>
      </div>
    </header>
  );
};

export default Header;
