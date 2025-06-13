import React from "react";
import { Button } from "../../../../components/ui/button";

export const ServicesSection = (): JSX.Element => {
  return (
    <header className="w-full bg-[url(/background-1.png)] bg-cover bg-center py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-[#dfdee1] text-[34.4px] font-normal">ilé</div>
          <div className="text-[#b7b6ba] text-[17.7px] font-normal">
            Legal
            <br />
            Marketplace
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="bg-[#1b1829] text-[#b1afb4] text-[17.7px] rounded-[8px_8px_3.25px_8px] border-[#282536] h-[42px]"
          >
            Home
          </Button>
          <Button
            variant="ghost"
            className="text-[#b6b5b9] text-[18.6px] h-[25px] px-0"
          >
            Sign In
          </Button>
          <Button
            variant="ghost"
            className="text-[#b1b0b4] text-[17.7px] h-6 px-0"
          >
            Register
          </Button>
        </div>
      </div>
    </header>
  );
};
