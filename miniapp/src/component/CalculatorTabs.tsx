import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CalendarClock, Zap, Shield, Coins } from "lucide-react";

interface CalculatorTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface CalculatorTabsProps {
  tabs: CalculatorTab[];
  defaultTab: string;
}

const CalculatorTabs = ({ tabs, defaultTab }: CalculatorTabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <TabsList className="inline-flex w-auto min-w-full space-x-2 bg-transparent">
          <TabsTrigger 
            value="retirement" 
            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === 'retirement'
                ? "bg-[#FDD15F]/10 text-[#FDD15F] border border-[#FDD15F]/30"
                : "bg-[#170F34]/50 text-[#ECF3F7]/70 hover:text-[#ECF3F7]"
            }`}
          >
            <span className="flex items-center justify-center">
              <CalendarClock className={`w-4 h-4 mr-2 ${activeTab === 'retirement' ? 'text-[#FDD15F]' : ''}`} />
              <span>Retirement</span>
            </span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="fire" 
            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === 'fire'
                ? "bg-[#FDD15F]/10 text-[#FDD15F] border border-[#FDD15F]/30"
                : "bg-[#170F34]/50 text-[#ECF3F7]/70 hover:text-[#ECF3F7]"
            }`}
          >
            <span className="flex items-center justify-center">
              <Zap className={`w-4 h-4 mr-2 ${activeTab === 'fire' ? 'text-[#FDD15F]' : ''}`} />
              <span>F.I.R.E</span>
            </span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="emergency" 
            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === 'emergency'
                ? "bg-[#FDD15F]/10 text-[#FDD15F] border border-[#FDD15F]/30"
                : "bg-[#170F34]/50 text-[#ECF3F7]/70 hover:text-[#ECF3F7]"
            }`}
          >
            <span className="flex items-center justify-center">
              <Shield className={`w-4 h-4 mr-2 ${activeTab === 'emergency' ? 'text-[#FDD15F]' : ''}`} />
              <span>Emergency Fund</span>
            </span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="savings" 
            className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === 'savings'
                ? "bg-[#FDD15F]/10 text-[#FDD15F] border border-[#FDD15F]/30"
                : "bg-[#170F34]/50 text-[#ECF3F7]/70 hover:text-[#ECF3F7]"
            }`}
          >
            <span className="flex items-center justify-center">
              <Coins className={`w-4 h-4 mr-2 ${activeTab === 'savings' ? 'text-[#FDD15F]' : ''}`} />
              <span>Savings</span>
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default CalculatorTabs;
