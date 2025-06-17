import React from "react";
import { Button } from "../../../../components/ui/button";

export const HowItWorksSection = (): JSX.Element => {
  return (
    <section className="w-full bg-[#1b1828] py-12">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
        <h2 className="text-[#e1e0e3] text-[30.8px] leading-[38.9px] font-normal font-['Inter',Helvetica] max-w-[583px]">
          Ready to streamline your property due diligence?
        </h2>

        <div className="flex gap-4">
          <Button className="bg-[#fec85f] text-[#443837] hover:bg-[#fec85f]/90 border border-[#fac65f] rounded-[9px] h-[55px] px-6 text-[23px] font-normal font-['Inter',Helvetica]">
            Register Now
          </Button>

          <Button
            variant="outline"
            className="bg-[#fdfcfd] text-[#4b4a50] hover:bg-[#fdfcfd]/90 border border-[#d0cacc] rounded-[9px] h-[55px] px-6 text-[23px] font-normal font-['Inter',Helvetica]"
          >
            Sign In
          </Button>
        </div>
      </div>
    </section>
  );
};
