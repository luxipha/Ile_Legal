import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ArrowLeft, Mail } from "lucide-react";
import { Dispute } from "./DisputeManagement";

interface ContactPartiesPageProps {
  dispute: Dispute;
  onBack: () => void;
  onSend: (message: {
    recipient: "buyer" | "seller" | "both";
    subject: string;
    message: string;
  }) => void;
}

export const ContactPartiesPage = ({ dispute, onBack, onSend }: ContactPartiesPageProps) => {
  const [recipient, setRecipient] = useState<"buyer" | "seller" | "both">("both");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!subject.trim()) {
      alert("Please enter a subject for your message.");
      return;
    }

    if (!message.trim()) {
      alert("Please enter a message.");
      return;
    }

    onSend({
      recipient,
      subject,
      message
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="mr-2 p-0 h-auto hover:bg-transparent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">Contact Dispute Parties</h2>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">{dispute.title}</h3>
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Buyer: {dispute.buyer}</p>
            <p className="text-sm text-gray-500">Seller: {dispute.seller}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{dispute.amount}</p>
            <p className="text-sm text-gray-500">Status: {dispute.status}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="both" onValueChange={(value) => setRecipient(value as "buyer" | "seller" | "both")}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="both">Both Parties</TabsTrigger>
            <TabsTrigger value="buyer">Buyer Only</TabsTrigger>
            <TabsTrigger value="seller">Seller Only</TabsTrigger>
          </TabsList>
          
          <TabsContent value="both">
            <p className="text-sm text-gray-600 mb-4">
              Send a message to both {dispute.buyer} (Buyer) and {dispute.seller} (Seller).
            </p>
          </TabsContent>
          
          <TabsContent value="buyer">
            <p className="text-sm text-gray-600 mb-4">
              Send a message to {dispute.buyer} (Buyer) only.
            </p>
          </TabsContent>
          
          <TabsContent value="seller">
            <p className="text-sm text-gray-600 mb-4">
              Send a message to {dispute.seller} (Seller) only.
            </p>
          </TabsContent>
        </Tabs>

        <div>
          <Label htmlFor="email-subject">Subject</Label>
          <input
            id="email-subject"
            value={subject}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <Label htmlFor="email-message">Message</Label>
          <Textarea 
            id="email-message"
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="mt-1 h-32"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828]"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        </div>
      </form>
    </div>
  );
};
