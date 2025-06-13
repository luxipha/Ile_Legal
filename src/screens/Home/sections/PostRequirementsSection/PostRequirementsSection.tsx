import React from "react";
import { Button } from "../../../../components/ui/button";

export const PostRequirementsSection = (): JSX.Element => {
  return (
    <section className="w-full py-16 flex flex-col items-center justify-center">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-[51.1px] leading-[59.5px] text-[#e1e0e3] font-normal font-['Inter',Helvetica] mb-12">
          Simplifiying Legal Due Diligence
          <br />
          for Property Transactions
        </h1>

        <div className="flex flex-wrap justify-center gap-4">
          <Button className="h-[55px] px-6 bg-[#fec85f] hover:bg-[#fec85f]/90 text-[#61542b] text-[19.3px] font-normal font-['Inter',Helvetica] rounded-[9px] border border-solid border-[#e2ce5f]">
            Hire Legal Professionals
          </Button>

          <Button
            variant="outline"
            className="h-[56px] px-6 bg-[#1b1729] text-[#c1c0c4] text-[18.8px] font-normal font-['Inter',Helvetica] rounded-[10px_6px_6px_9px] border border-solid border-[#504d61] hover:bg-[#1b1729]/90"
          >
            Join as Legal Professional
          </Button>
        </div>
      </div>
    </section>
  );
};
