import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export const PublicLawyerProfileTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">Public Lawyer Profile Test</h1>
          <p className="text-gray-600 mb-4">This is a test to check if the basic component renders</p>
          <Button>Test Button</Button>
        </CardContent>
      </Card>
    </div>
  );
};